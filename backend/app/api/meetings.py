from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Header, BackgroundTasks
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
import os
import uuid
import asyncio
import logging
from typing import List, Optional

from app.database.connection import get_db, SessionLocal
from app.models import Meeting, Transcript, Summary, ActionItem, Topic
from app.schemas.meeting import MeetingResponse, MeetingDetailResponse, ActionItemResponse
from app.auth.deps import get_current_user
from app.models.user import User
from app.utils.config import settings
from app.utils.audio import get_audio_duration
from app.services.whisper_service import transcribe_audio
from app.services.gemini_service import analyze_transcript
from app.services.pdf_service import generate_meeting_pdf

logger = logging.getLogger("meetmind.meetings")
router = APIRouter(prefix="/meetings", tags=["Meetings"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def run_async_meeting_pipeline(meeting_id: int):
    """
    Entry point for FastAPI BackgroundTasks.
    BackgroundTasks run in a thread — we create a fresh event loop here
    so we can safely await async functions without nest_asyncio hacks.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(
            _async_meeting_pipeline(meeting_id)
        )
    finally:
        loop.close()


async def _async_meeting_pipeline(meeting_id: int):
    """
    Full async pipeline: transcription → AI analysis → PDF generation.
    Uses its own DB session (background thread, not the request session).
    """
    db: Session = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            logger.error(f"Background pipeline: Meeting {meeting_id} not found.")
            return

        # ── Step 1: Transcription ──────────────────────────────────────────────
        meeting.status = "transcribing"
        meeting.error_message = None
        db.commit()
        logger.info(f"Meeting {meeting_id}: starting transcription...")

        existing_transcript = (
            db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
        )
        if existing_transcript:
            transcript_text = existing_transcript.transcript
            logger.info(f"Meeting {meeting_id}: reusing existing transcript.")
        else:
            # This is the await that previously had no event loop to run in
            transcript_text = await transcribe_audio(
                meeting.filepath,
                meeting.duration,
            )
            db.add(Transcript(meeting_id=meeting.id, transcript=transcript_text))
            db.commit()
            logger.info(f"Meeting {meeting_id}: transcription saved ({len(transcript_text)} chars).")

        # ── Step 2: AI Analysis ────────────────────────────────────────────────
        meeting.status = "summarizing"
        db.commit()
        logger.info(f"Meeting {meeting_id}: starting AI analysis...")

        # Wipe stale analysis so re-runs are clean
        db.query(Summary).filter(Summary.meeting_id == meeting_id).delete()
        db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).delete()
        db.query(Topic).filter(Topic.meeting_id == meeting_id).delete()
        db.commit()

        analysis = await analyze_transcript(transcript_text)

        summary_obj = Summary(
            meeting_id=meeting.id,
            summary=analysis.get("summary", ""),
            sentiment=analysis.get("sentiment", "Neutral"),
            sentiment_explanation=analysis.get("sentiment_explanation", ""),
        )
        db.add(summary_obj)

        for item_text in analysis.get("action_items", []):
            db.add(ActionItem(meeting_id=meeting.id, item=item_text, completed=False))

        for topic_name in analysis.get("topics", []):
            db.add(Topic(meeting_id=meeting.id, name=topic_name))

        # Auto-update title if still placeholder
        if not meeting.title.strip() or meeting.title.lower() == "untitled meeting":
            meeting.title = analysis.get("title", "Analyzed Meeting")

        db.commit()
        logger.info(f"Meeting {meeting_id}: AI analysis saved.")

        # ── Step 3: PDF Generation ─────────────────────────────────────────────
        logger.info(f"Meeting {meeting_id}: generating PDF...")
        try:
            # Re-query to get committed IDs
            summary_obj = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
            actions = [
                a.item
                for a in db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()
            ]
            topics_list = [
                t.name
                for t in db.query(Topic).filter(Topic.meeting_id == meeting_id).all()
            ]

            generate_meeting_pdf(
                meeting_title=meeting.title,
                upload_date=meeting.upload_date,
                duration=meeting.duration,
                summary_md=summary_obj.summary if summary_obj else "",
                action_items=actions,
                topics=topics_list,
                sentiment=summary_obj.sentiment if summary_obj else "Neutral",
                sentiment_explanation=summary_obj.sentiment_explanation if summary_obj else "",
                transcript_text=transcript_text,
                filename=meeting.filename,
            )
            logger.info(f"Meeting {meeting_id}: PDF generated.")
        except Exception as pdf_err:
            # PDF failure is non-fatal — meeting still marked complete
            logger.error(f"Meeting {meeting_id}: PDF generation failed (non-fatal): {pdf_err}")

        # ── Done ───────────────────────────────────────────────────────────────
        meeting.status = "completed"
        meeting.error_message = None
        db.commit()
        logger.info(f"Meeting {meeting_id}: pipeline complete.")

    except Exception as exc:
        logger.exception(f"Meeting {meeting_id}: pipeline failed — {exc}")
        try:
            meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
            if meeting:
                meeting.status = "failed"
                meeting.error_message = str(exc)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=MeetingResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info(
        f"Upload request: '{file.filename}' by '{current_user.username}' (local offline pipeline)"
    )

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{file_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds {MAX_FILE_SIZE // (1024 * 1024)} MB limit.",
        )

    unique_filename = f"{uuid.uuid4()}{file_ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, unique_filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as buf:
        buf.write(contents)

    duration = get_audio_duration(filepath)
    meeting_title = title.strip() if (title and title.strip()) else "Untitled Meeting"

    meeting = Meeting(
        user_id=current_user.id,
        title=meeting_title,
        filename=file.filename,
        filepath=filepath,
        duration=duration,
        status="uploading",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    background_tasks.add_task(
        run_async_meeting_pipeline,
        meeting.id,
    )

    return meeting


@router.get("", response_model=List[MeetingResponse])
def list_meetings(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Meeting).filter(Meeting.user_id == current_user.id)

    if q and q.strip():
        search_filter = or_(
            Meeting.title.contains(q),
            Meeting.filename.contains(q),
            Meeting.id.in_(
                db.query(Transcript.meeting_id).filter(Transcript.transcript.contains(q))
            ),
            Meeting.id.in_(
                db.query(Summary.meeting_id).filter(Summary.summary.contains(q))
            ),
            Meeting.id.in_(
                db.query(Topic.meeting_id).filter(Topic.name.contains(q))
            ),
        )
        query = query.filter(search_filter)

    return query.order_by(Meeting.upload_date.desc()).limit(limit).offset(offset).all()


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id,
    ).first()

    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id,
    ).first()

    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    if os.path.exists(meeting.filepath):
        try:
            os.remove(meeting.filepath)
        except Exception:
            pass

    pdf_prefix = f"{meeting.filename.split('.')[0]}_"
    if os.path.exists(settings.PDF_DIR):
        for f in os.listdir(settings.PDF_DIR):
            if f.startswith(pdf_prefix) and f.endswith(".pdf"):
                try:
                    os.remove(os.path.join(settings.PDF_DIR, f))
                except Exception:
                    pass

    db.delete(meeting)
    db.commit()


@router.post("/{meeting_id}/analyze", response_model=MeetingResponse)
def reanalyze_meeting(
    meeting_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id,
    ).first()

    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    # Wipe everything for a full re-run
    db.query(Transcript).filter(Transcript.meeting_id == meeting_id).delete()
    db.query(Summary).filter(Summary.meeting_id == meeting_id).delete()
    db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).delete()
    db.query(Topic).filter(Topic.meeting_id == meeting_id).delete()
    db.commit()

    meeting.status = "transcribing"
    meeting.error_message = None
    db.commit()

    background_tasks.add_task(
        run_async_meeting_pipeline,
        meeting.id,
    )

    return meeting


@router.get("/{meeting_id}/pdf")
def download_pdf(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id,
    ).first()

    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    if meeting.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting analysis is not yet complete.",
        )

    pdf_prefix = f"{meeting.filename.split('.')[0]}_"
    pdf_path = None
    if os.path.exists(settings.PDF_DIR):
        matching_files = []
        for f in os.listdir(settings.PDF_DIR):
            if f.startswith(pdf_prefix) and f.endswith(".pdf"):
                full_path = os.path.join(settings.PDF_DIR, f)
                matching_files.append((full_path, os.path.getmtime(full_path)))
        if matching_files:
            # Sort by modification time descending to get the newest file
            matching_files.sort(key=lambda x: x[1], reverse=True)
            pdf_path = matching_files[0][0]

    if not pdf_path or not os.path.exists(pdf_path):
        try:
            summary_obj = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
            transcript_obj = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
            actions = [
                a.item
                for a in db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()
            ]
            topics_list = [
                t.name
                for t in db.query(Topic).filter(Topic.meeting_id == meeting_id).all()
            ]

            pdf_path = generate_meeting_pdf(
                meeting_title=meeting.title,
                upload_date=meeting.upload_date,
                duration=meeting.duration,
                summary_md=summary_obj.summary if summary_obj else "No Summary",
                action_items=actions,
                topics=topics_list,
                sentiment=summary_obj.sentiment if summary_obj else "Neutral",
                sentiment_explanation=summary_obj.sentiment_explanation if summary_obj else "",
                transcript_text=transcript_obj.transcript if transcript_obj else "No Transcript",
                filename=meeting.filename,
            )
        except Exception as e:
            logger.exception("Failed to regenerate PDF on-the-fly")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"PDF generation failed: {e}",
            )

    safe_title = (
        "".join(c for c in meeting.title if c.isalnum() or c in (" ", "-", "_"))
        .strip()
        .replace(" ", "_")
    )
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"MeetMind_Report_{safe_title}.pdf",
    )


@router.post("/{meeting_id}/action-items/{item_id}/toggle", response_model=ActionItemResponse)
def toggle_action_item(
    meeting_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id,
    ).first()

    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    action_item = db.query(ActionItem).filter(
        ActionItem.id == item_id,
        ActionItem.meeting_id == meeting_id,
    ).first()

    if not action_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found")

    action_item.completed = not action_item.completed
    db.commit()
    db.refresh(action_item)
    return action_item