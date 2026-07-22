from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    item = Column(String, nullable=False)
    completed = Column(Boolean, default=False)

    # Relationships
    meeting = relationship("Meeting", back_populates="action_items")
