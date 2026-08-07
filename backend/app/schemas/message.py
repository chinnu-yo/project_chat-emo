from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class MessageBase(BaseModel):
    sender_role: str = Field(..., description="Role of the sender: 'sender' or 'recipient'")
    text: str = Field(..., min_length=1, description="Message text content")

class ClassifyRequest(MessageBase):
    custom_valence: Optional[float] = Field(None, ge=-1.0, le=1.0, description="Pre-send manual Valence override")
    custom_arousal: Optional[float] = Field(None, ge=0.0, le=1.0, description="Pre-send manual Arousal override")
    custom_label: Optional[str] = Field(None, description="Pre-send manual emotion label override")

class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Message text content to predict tone for")

class EmotionScore(BaseModel):
    valence: float = Field(..., ge=-1.0, le=1.0, description="Valence (-1.0 Negative to +1.0 Positive)")
    arousal: float = Field(..., ge=0.0, le=1.0, description="Arousal (0.0 Calm to 1.0 Intense)")
    color_hex: str = Field(..., description="Hex color string computed from Valence-Arousal")
    emotion_label: str = Field(..., description="Human-readable emotion tag")
    is_corrected: bool = Field(False, description="Whether score comes from a user override")

class MessageResponse(MessageBase, EmotionScore):
    id: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class DeleteHistoryResponse(BaseModel):
    message: str
    count: int
