from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.message import MessageResponse

class OverrideRequest(BaseModel):
    message_id: Optional[int] = Field(None, description="Optional target message ID to update immediately")
    phrase_pattern: str = Field(..., min_length=1, description="Text phrase to register override for")
    corrected_valence: float = Field(..., ge=-1.0, le=1.0, description="Corrected Valence score")
    corrected_arousal: float = Field(..., ge=0.0, le=1.0, description="Corrected Arousal score")
    corrected_label: str = Field(..., description="Human-readable emotion label")

class OverrideResponse(BaseModel):
    id: int
    phrase_pattern: str
    corrected_valence: float
    corrected_arousal: float
    color_hex: str
    corrected_label: str
    updated_message: Optional[MessageResponse] = None
