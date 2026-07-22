from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ActionItemResponse(BaseModel):
    id: int
    meeting_id: int
    item: str
    completed: bool

    class Config:
        from_attributes = True

class TopicResponse(BaseModel):
    id: int
    meeting_id: int
    name: str

    class Config:
        from_attributes = True

class SummaryResponse(BaseModel):
    id: int
    meeting_id: int
    summary: str
    sentiment: Optional[str] = None
    sentiment_explanation: Optional[str] = None

    class Config:
        from_attributes = True

class TranscriptResponse(BaseModel):
    id: int
    meeting_id: int
    transcript: str

    class Config:
        from_attributes = True

# Flat response for listings and dashboard
class MeetingResponse(BaseModel):
    id: int
    user_id: int
    title: str
    filename: str
    upload_date: datetime
    duration: float
    status: str
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

# Detailed response with nested structures
class MeetingDetailResponse(MeetingResponse):
    transcript: Optional[TranscriptResponse] = None
    summary: Optional[SummaryResponse] = None
    action_items: List[ActionItemResponse] = []
    topics: List[TopicResponse] = []

    class Config:
        from_attributes = True
