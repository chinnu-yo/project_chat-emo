# Technical Architecture & System Design

## System Architecture

┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  ┌──────────────────────┐      ┌─────────────────────────┐  │
│  │  WhatsApp Chat UI    │      │  2D Color Inspector     │  │
│  └──────────┬───────────┘      └────────────┬────────────┘  │
└─────────────┼───────────────────────────────┼───────────────┘
│ REST API                      │ Drag Coordinates
▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Tone Classification Engine                │  │
│  └──────────┬───────────────────────────────┬────────────┘  │
└─────────────┼───────────────────────────────┼───────────────┘
│ Query Overrides               │ Fallback Scoring
▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│   SQLite Database         │   │   Google Gemini 1.5 Flash   │
│ - Messages                │   │   JSON Structured Output    │
│ - UserOverrides           │   └─────────────────────────────┘
└───────────────────────────┘


---

## Emotion Coordinate & Color Mapping Algorithm

### 1. Valence-Arousal Bounds
* **Valence ($V$):** $[-1.0, 1.0]$ (Negative $\rightarrow$ Positive)
* **Arousal ($A$):** $[0.0, 1.0]$ (Low Intensity $\rightarrow$ High Intensity)

### 2. Color Conversion Formula
* **Hue ($H$):** Mapped from Valence:
  $$H = \left( \frac{V + 1.0}{2.0} \right) \times 120^\circ \quad \text{(0° Red = Negative, 60° Yellow = Neutral, 120° Green = Positive)}$$
* **Saturation ($S$):** Mapped from Arousal ($50\% \rightarrow 100\%$).
* **Lightness ($L$):** Base $50\%$, boosted slightly for positive valence.
* **HEX Output:** Converted from HSL to Hex color string (e.g., `#FF5733`).

---

## Database Schema (`schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_role TEXT NOT NULL, -- 'sender' OR 'recipient'
    text TEXT NOT NULL,
    valence REAL NOT NULL,     -- Range: -1.0 to 1.0
    arousal REAL NOT NULL,     -- Range: 0.0 to 1.0
    color_hex TEXT NOT NULL,   -- e.g., '#EF4444'
    emotion_label TEXT NOT NULL,
    is_corrected BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phrase_pattern TEXT UNIQUE NOT NULL,
    corrected_valence REAL NOT NULL,
    corrected_arousal REAL NOT NULL,
    corrected_label TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);