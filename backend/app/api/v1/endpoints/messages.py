from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite
from typing import List
from app.db.database import get_db
from app.schemas.message import (
    ClassifyRequest,
    PredictRequest,
    EmotionScore,
    MessageResponse,
    DeleteHistoryResponse
)
from app.services.emotion_service import classify_text
from app.services.color_service import valence_arousal_to_hex, derive_emotion_label
from app.services.db_service import create_message, get_all_messages, clear_all_messages, save_user_override

router = APIRouter()

@router.get("/messages", response_model=List[MessageResponse])
async def list_messages(db: aiosqlite.Connection = Depends(get_db)):
    """Retrieve conversation history."""
    try:
        return await get_all_messages(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@router.post("/messages/predict", response_model=EmotionScore, status_code=status.HTTP_200_OK)
async def predict_message_tone(
    req: PredictRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Predict emotional tone for draft text without persisting to database (for pre-send preview)."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        scores = await classify_text(db, req.text)
        return EmotionScore(**scores)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tone prediction failed: {str(e)}")

@router.post("/messages/classify", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def classify_and_save_message(
    req: ClassifyRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Classify emotional tone of a text message, persist to database, and return formatted response.
    Supports pre-send custom Valence/Arousal/Label overrides.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Message text cannot be empty.")
    if req.sender_role not in ["sender", "recipient"]:
        raise HTTPException(status_code=400, detail="sender_role must be 'sender' or 'recipient'.")

    try:
        # Check if client provided custom pre-send override coordinates
        if req.custom_valence is not None and req.custom_arousal is not None:
            val = float(req.custom_valence)
            aro = float(req.custom_arousal)
            label = req.custom_label if req.custom_label else derive_emotion_label(val, aro)
            color_hex = valence_arousal_to_hex(val, aro)
            is_corrected = True

            # Save pattern to user_overrides so future occurrences use this score
            await save_user_override(
                db=db,
                phrase_pattern=req.text,
                corrected_valence=val,
                corrected_arousal=aro,
                corrected_label=label
            )

            message = await create_message(
                db=db,
                sender_role=req.sender_role,
                text=req.text,
                valence=val,
                arousal=aro,
                color_hex=color_hex,
                emotion_label=label,
                is_corrected=is_corrected
            )
            return message

        # Otherwise perform standard AI scoring & Zero-RAG lookup
        scores = await classify_text(db, req.text)
        message = await create_message(
            db=db,
            sender_role=req.sender_role,
            text=req.text,
            valence=scores["valence"],
            arousal=scores["arousal"],
            color_hex=scores["color_hex"],
            emotion_label=scores["emotion_label"],
            is_corrected=scores["is_corrected"]
        )
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.delete("/messages", response_model=DeleteHistoryResponse)
async def delete_chat_history(db: aiosqlite.Connection = Depends(get_db)):
    """Clear all chat history from database."""
    try:
        deleted_count = await clear_all_messages(db)
        return DeleteHistoryResponse(message="Chat history cleared successfully.", count=deleted_count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")
