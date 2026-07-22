from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models import Meeting, Summary, ActionItem
from app.auth.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("")
def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves high-level statistics for the authenticated user's dashboard."""
    # 1. Total Meetings
    total_meetings = db.query(Meeting).filter(Meeting.user_id == current_user.id).count()
    
    # 2. Total Hours (sum duration in seconds / 3600)
    duration_sum = db.query(func.sum(Meeting.duration)).filter(
        Meeting.user_id == current_user.id,
        Meeting.status == "completed"
    ).scalar() or 0.0
    total_hours = round(duration_sum / 3600.0, 2)
    
    # 3. Summaries Generated
    summaries_generated = db.query(Summary).join(Meeting).filter(
        Meeting.user_id == current_user.id
    ).count()
    
    # 4. Pending Action Items
    pending_action_items = db.query(ActionItem).join(Meeting).filter(
        Meeting.user_id == current_user.id,
        ActionItem.completed == False
    ).count()
    
    return {
        "total_meetings": total_meetings,
        "total_hours": total_hours,
        "summaries_generated": summaries_generated,
        "pending_action_items": pending_action_items
    }
