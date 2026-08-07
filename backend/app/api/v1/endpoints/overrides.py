from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite
from app.db.database import get_db
from app.schemas.override import OverrideRequest, OverrideResponse
from app.services.color_service import valence_arousal_to_hex
from app.services.db_service import (
    save_user_override,
    update_message_emotion,
    get_message_by_id
)

router = APIRouter()

@router.post("/overrides", response_model=OverrideResponse, status_code=status.HTTP_200_OK)
async def create_or_update_override(
    req: OverrideRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Save a user's manual drag-to-correct emotion override.
    Persists override pattern in `user_overrides` table and updates the specified message in SQLite.
    """
    phrase = req.phrase_pattern.strip()
    if not phrase:
        raise HTTPException(status_code=400, detail="Phrase pattern cannot be empty.")

    try:
        # Save override to user_overrides table
        override_record = await save_user_override(
            db=db,
            phrase_pattern=phrase,
            corrected_valence=req.corrected_valence,
            corrected_arousal=req.corrected_arousal,
            corrected_label=req.corrected_label
        )

        computed_hex = valence_arousal_to_hex(req.corrected_valence, req.corrected_arousal)
        updated_msg = None

        # If a message_id was supplied, update that specific message in DB
        if req.message_id:
            try:
                updated_msg = await update_message_emotion(
                    db=db,
                    message_id=req.message_id,
                    valence=req.corrected_valence,
                    arousal=req.corrected_arousal,
                    color_hex=computed_hex,
                    emotion_label=req.corrected_label
                )
            except Exception as ex:
                pass

        return OverrideResponse(
            id=override_record["id"],
            phrase_pattern=override_record["phrase_pattern"],
            corrected_valence=override_record["corrected_valence"],
            corrected_arousal=override_record["corrected_arousal"],
            color_hex=computed_hex,
            corrected_label=override_record["corrected_label"],
            updated_message=updated_msg
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save override: {str(e)}")
