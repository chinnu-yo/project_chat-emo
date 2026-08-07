import json
import logging
import re
import aiosqlite
from typing import Dict, Any, Tuple
from app.core.config import settings
from app.services.color_service import valence_arousal_to_hex, derive_emotion_label
from app.services.db_service import get_override_for_phrase, get_recent_overrides

logger = logging.getLogger(__name__)

# Heuristic sentiment & intensity dictionary for fallback scoring
POSITIVE_WORDS = {"happy", "great", "awesome", "fantastic", "love", "good", "wonderful", "excellent", "super", "cool", "yay", "best", "thanks", "excited", "amazing"}
NEGATIVE_WORDS = {"sad", "angry", "hate", "terrible", "bad", "awful", "horrible", "upset", "worst", "annoyed", "frustrated", "furious", "disappointed", "mad"}
HIGH_AROUSAL_WORDS = {"excited", "angry", "furious", "urgent", "super", "fantastic", "horrible", "amazing", "omg", "wow", "now", "immediately", "hate", "love"}
LOW_AROUSAL_WORDS = {"calm", "relax", "quiet", "okay", "fine", "peaceful", "sleep", "slow", "maybe", "cool"}

def heuristic_classify(text: str) -> Tuple[float, float, str]:
    """Fallback sentiment heuristic when Gemini API is unavailable."""
    words = re.findall(r'\w+', text.lower())
    if not words:
        return 0.0, 0.2, "Neutral"

    pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)
    high_arousal_count = sum(1 for w in words if w in HIGH_AROUSAL_WORDS) + (1 if "!" in text else 0)
    low_arousal_count = sum(1 for w in words if w in LOW_AROUSAL_WORDS)

    # Valence calculation (-1.0 to 1.0)
    total_sentiment = pos_count + neg_count
    if total_sentiment > 0:
        valence = (pos_count - neg_count) / float(total_sentiment)
    else:
        valence = 0.0

    # Arousal calculation (0.0 to 1.0)
    total_arousal = high_arousal_count + low_arousal_count
    if total_arousal > 0:
        arousal = 0.3 + 0.6 * (high_arousal_count / float(total_arousal))
    else:
        arousal = 0.3 + (0.3 if "!" in text or text.isupper() else 0.0)

    valence = max(-1.0, min(1.0, round(valence, 2)))
    arousal = max(0.0, min(1.0, round(arousal, 2)))
    label = derive_emotion_label(valence, arousal)

    return valence, arousal, label

async def call_gemini_api(text: str, recent_overrides: list) -> Tuple[float, float, str]:
    """Query Gemini 1.5 Flash to predict Valence (-1.0 to 1.0) and Arousal (0.0 to 1.0)."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.info("No GEMINI_API_KEY provided. Using heuristic fallback classification.")
        return heuristic_classify(text)

    # Construct system prompt with Zero-RAG few-shot context
    override_context = ""
    if recent_overrides:
        examples = []
        for ov in recent_overrides:
            examples.append(f"- Phrase: '{ov['phrase_pattern']}' -> Valence: {ov['corrected_valence']}, Arousal: {ov['corrected_arousal']}, Label: '{ov['corrected_label']}'")
        override_context = "\nUser Preferred Style/Overrides:\n" + "\n".join(examples) + "\n"

    system_prompt = f"""You are an expert psychological sentiment analyzer following Russell's Circumplex Model of Affect.
Analyze the given text message and output a structured JSON object with valence and arousal scores.

Bounds:
- valence: float between -1.0 (extremely negative/sad/angry) and +1.0 (extremely positive/joyful/happy). 0.0 is neutral.
- arousal: float between 0.0 (calm/serene/passive) and 1.0 (intense/excited/furious).
- emotion_label: short descriptive emotion string (e.g. "Joyful", "Angry", "Calm", "Anxious", "Neutral").
{override_context}
Output ONLY valid JSON matching this schema:
{{
  "valence": float,
  "arousal": float,
  "emotion_label": string
}}
"""

    try:
        # Try google.genai or google.generativeai
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=f"{system_prompt}\n\nText message: \"{text}\""
            )
            raw_text = response.text
        except ImportError:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(f"{system_prompt}\n\nText message: \"{text}\"")
            raw_text = response.text

        # Extract JSON from code block if formatted with ```json
        clean_json_str = raw_text.strip()
        if "```json" in clean_json_str:
            clean_json_str = clean_json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json_str:
            clean_json_str = clean_json_str.split("```")[1].split("```")[0].strip()

        data = json.loads(clean_json_str)
        valence = max(-1.0, min(1.0, float(data.get("valence", 0.0))))
        arousal = max(0.0, min(1.0, float(data.get("arousal", 0.3))))
        label = str(data.get("emotion_label", derive_emotion_label(valence, arousal)))

        return valence, arousal, label

    except Exception as e:
        logger.warning(f"Gemini API call failed or timed out: {e}. Falling back to heuristic analyzer.")
        return heuristic_classify(text)

async def classify_text(db: aiosqlite.Connection, text: str) -> Dict[str, Any]:
    """
    Classify a text message:
    1. Check for exact user override in SQLite database (Zero-RAG).
    2. If match found, return saved coordinates and is_corrected=True.
    3. If no match, fetch recent overrides as prompt context and query Gemini 1.5 Flash.
    4. Convert valence-arousal to color_hex.
    """
    cleaned_text = text.strip()
    
    # Step 1: Check exact user override
    override = await get_override_for_phrase(db, cleaned_text)
    if override:
        val = override["corrected_valence"]
        aro = override["corrected_arousal"]
        label = override["corrected_label"]
        color_hex = valence_arousal_to_hex(val, aro)
        return {
            "valence": val,
            "arousal": aro,
            "color_hex": color_hex,
            "emotion_label": label,
            "is_corrected": True
        }

    # Step 2: Fetch recent overrides for context
    recent_overrides = await get_recent_overrides(db, limit=5)

    # Step 3: Call Gemini API (or fallback)
    val, aro, label = await call_gemini_api(cleaned_text, recent_overrides)
    color_hex = valence_arousal_to_hex(val, aro)

    return {
        "valence": val,
        "arousal": aro,
        "color_hex": color_hex,
        "emotion_label": label,
        "is_corrected": False
    }
