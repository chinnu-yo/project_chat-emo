# Tone & Emotion Detector MVP

## High-Level Vision
A local-first, WhatsApp-style messaging interface that detects emotional tone in text messages using **Russell's Circumplex Model of Affect (Valence–Arousal)**. 

Instead of discrete text tags, emotional tone is visualized dynamically using a **2D color-gradient spectrum**. Users can test messaging from two roles (Sender/Recipient) and interactively adjust predictions via a drag-and-drop 2D coordinate graph, which persists personalized corrections locally without requiring vector databases or complex fine-tuning.

---

## Key Feature Requirements
1. **WhatsApp-Style Messaging UI:**
   - Simulated double-role view (Sender vs Recipient toggle).
   - Chat bubbles dynamically styled by emotion valence and arousal colors.
   - Session history and message logs persisted locally in SQLite.

2. **2D Valence-Arousal Spectrum Visualizer:**
   - Interactive 2D gradient box:
     - **X-Axis (Valence):** -1.0 (Negative) ↔ +1.0 (Positive)
     - **Y-Axis (Arousal):** 0.0 (Calm) ↔ 1.0 (Intense)
   - Dynamic Color Mapping: Hue mapped to Valence, Saturation/Brightness mapped to Arousal.
   - Interactive dot placement matching the text's calculated coordinates.

3. **Drag-to-Correct Feedback Loop:**
   - Selecting a chat bubble opens the 2D gradient inspector.
   - User can drag the dot to override the AI's predicted emotion.
   - Saved overrides immediately update the chat bubble visual and register a pattern override in the local database.

4. **Zero-RAG Personalization Engine:**
   - Backend checks `UserOverride` SQLite table during classification.
   - Exact phrase matches or few-shot context inject user corrections directly into the Gemini API prompt.

---

## Tech Stack Overview
- **Frontend Framework:** Next.js (App Router, React, TypeScript)
- **UI & Styling:** Tailwind CSS, `shadcn/ui`, `lucide-react`
- **Backend API:** Python (FastAPI), Pydantic
- **Database:** SQLite (via Python `sqlite3` or SQLAlchemy)
- **AI Intelligence:** Google Gemini API (Free Tier `gemini-1.5-flash`)