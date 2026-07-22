from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.connection import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    upload_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    duration = Column(Float, default=0.0)  # In seconds
    status = Column(String, default="processing")  # uploading, transcribing, summarizing, completed, failed
    error_message = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="meetings")
    transcript = relationship("Transcript", uselist=False, back_populates="meeting", cascade="all, delete-orphan")
    summary = relationship("Summary", uselist=False, back_populates="meeting", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="meeting", cascade="all, delete-orphan")
