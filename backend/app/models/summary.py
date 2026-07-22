from sqlalchemy import Column, Integer, Text, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False)
    summary = Column(Text, nullable=False)
    sentiment = Column(String, nullable=True)  # positive, neutral, negative
    sentiment_explanation = Column(Text, nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="summary")
