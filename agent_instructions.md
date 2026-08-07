### File 3: agent_instructions.md


# Antigravity Developer Agent Instructions

## Role & Mission
You are an autonomous senior developer agent inside Google Antigravity IDE. Your goal is to construct a production-ready, fully functional MVP of the Tone & Emotion Detector using Next.js, FastAPI, SQLite, and the Google Gemini API.

## Core Rules & Guardrails
1. **Zero External Billing:** Rely exclusively on the free-tier Gemini API (`gemini-1.5-flash`) and local SQLite. Do NOT add paid cloud infrastructure or vector DB extensions.
2. **Strict Schema Integrity:** Always adhere strictly to the SQLite schema and Valence-Arousal coordinate bounds defined in `DESIGN.md`.
3. **Structured JSON Responses:** When querying Gemini, enforce structured JSON output using Pydantic models:
   ```json
   {
     "valence": float,
     "arousal": float,
     "emotion_label": string,
     "color_hex": string
   }
Code Safety: Run all dev server scripts (uvicorn main:app --reload and npm run dev) through Antigravity's terminal runner. Verify functionality visually using the Browser Agent.

Step-by-Step Task Execution
Step 1: Initialize FastAPI project with SQLite connection, setup Pydantic schemas, and create /api/classify and /api/override endpoints.

Step 2: Integrate google-genai SDK with Gemini 1.5 Flash using structured JSON responses.

Step 3: Setup Next.js app router with Tailwind CSS and shadcn/ui components.

Step 4: Build the WhatsApp-style dual-role messaging UI.

Step 5: Create the 2D Valence-Arousal Canvas/SVG component with drag-and-drop dot controls.

Step 6: Connect Frontend and Backend, and verify end-to-end functionality using Antigravity's Browser Agent.