import os
import sys
from datetime import datetime, timezone

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import Base, engine, SessionLocal
from app.models import User, Meeting, Transcript, Summary, ActionItem, Topic
from app.auth.jwt import hash_password, verify_password, create_access_token
from app.services.whisper_service import transcribe_audio
from app.services.gemini_service import analyze_transcript
from app.services.pdf_service import generate_meeting_pdf

def verify_backend():
    print("=== Start Backend Verification ===")
    
    # 1. Test Database Creation
    print("\n[1/5] Testing database table creation...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    # 2. Test User Hashing & Auth
    print("\n[2/5] Testing password hashing and JWT token creation...")
    pwd = "password123"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed), "Password verification failed"
    assert not verify_password("wrongpass", hashed), "Invalid password accepted"
    
    token = create_access_token(subject=1)
    assert token is not None, "JWT token generation failed"
    print("Authentication utilities: PASSED")

    # 3. Test Whisper Fallback Service
    print("\n[3/5] Testing Whisper transcription service (fallback)...")
    import asyncio
    
    # Run async function using helper
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    transcript = loop.run_until_complete(
        transcribe_audio("mock_file.mp3", duration=120.0, custom_api_key="")
    )
    print("Generated transcript sample length:", len(transcript))
    assert len(transcript) > 0, "Transcript generation failed"
    print("Whisper mock fallback: PASSED")

    # 4. Test Gemini Fallback Service
    print("\n[4/5] Testing Gemini analysis service (fallback)...")
    analysis = loop.run_until_complete(
        analyze_transcript(transcript, custom_api_key="")
    )
    assert analysis["title"] is not None, "Title extraction failed"
    assert len(analysis["action_items"]) > 0, "Action items list empty"
    assert len(analysis["topics"]) > 0, "Topics list empty"
    print("Extracted Title:", analysis["title"])
    print("Gemini mock fallback: PASSED")

    # 5. Test PDF Generation
    print("\n[5/5] Testing PDF report generation...")
    # Ensure PDF directory exists
    from app.utils.config import settings
    os.makedirs(settings.PDF_DIR, exist_ok=True)
    
    pdf_path = generate_meeting_pdf(
        meeting_title="Verification Test Meeting",
        upload_date=datetime.now(timezone.utc),
        duration=150.0,
        summary_md=analysis["summary"],
        action_items=analysis["action_items"],
        topics=analysis["topics"],
        sentiment=analysis["sentiment"],
        sentiment_explanation=analysis["sentiment_explanation"],
        transcript_text=transcript,
        filename="verify_test.mp3"
    )
    
    print("Generated PDF at:", pdf_path)
    assert os.path.exists(pdf_path), "PDF file was not created"
    print("PDF Generation: PASSED")

    # Cleanup temporary PDF
    try:
        os.remove(pdf_path)
        print("Cleaned up temporary verification PDF.")
    except Exception:
        pass
        
    print("\n=== Backend Verification Completed Successfully ===")

if __name__ == "__main__":
    verify_backend()
