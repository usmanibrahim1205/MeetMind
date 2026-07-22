from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.auth import LoginRequest, Token
from app.auth.jwt import hash_password, verify_password, create_access_token
from app.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Create user
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hash_password(user_in.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # Check if input is email or username
    user = db.query(User).filter(
        (User.username == credentials.username) | (User.email == credentials.username)
    ).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Create access token
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If username is updating, check uniqueness
    if user_update.username and user_update.username != current_user.username:
        if db.query(User).filter(User.username == user_update.username).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already in use")
        current_user.username = user_update.username
        
    # If email is updating, check uniqueness
    if user_update.email and user_update.email != current_user.email:
        if db.query(User).filter(User.email == user_update.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        current_user.email = user_update.email
        
    # If changing password
    if user_update.new_password:
        if not user_update.current_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password required to change password")
        if not verify_password(user_update.current_password, current_user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
        current_user.password_hash = hash_password(user_update.new_password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import os
    from app.utils.config import settings
    from app.models import Meeting

    # Fetch all meetings belonging to the user to clean up disk storage
    meetings = db.query(Meeting).filter(Meeting.user_id == current_user.id).all()
    for meeting in meetings:
        # Delete audio file
        if meeting.filepath and os.path.exists(meeting.filepath):
            try:
                os.remove(meeting.filepath)
            except Exception:
                pass
        
        # Delete generated PDF report(s)
        if meeting.filename:
            pdf_prefix = f"{meeting.filename.split('.')[0]}_"
            if os.path.exists(settings.PDF_DIR):
                for f in os.listdir(settings.PDF_DIR):
                    if f.startswith(pdf_prefix) and f.endswith(".pdf"):
                        try:
                            os.remove(os.path.join(settings.PDF_DIR, f))
                        except Exception:
                            pass

    # Delete the user from DB (SQL cascades will clean table relations)
    db.delete(current_user)
    db.commit()
    return


