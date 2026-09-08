import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import FRONTEND_URL
from app.database.database import SessionLocal
from app.models.user import User
from app.security import verify_password, hash_password, create_access_token
from app.services.email_service import send_password_reset_email
from pydantic import BaseModel, EmailStr

RESET_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================
# Database Dependency
# ==========================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================
# Login Request Schema
# ==========================

class LoginRequest(BaseModel):
    username: str
    password: str


# ==========================
# Login Endpoint
# ==========================

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.username == request.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        request.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    if not user.active:
        raise HTTPException(
            status_code=403,
            detail="Account has been disabled"
        )

    token = create_access_token(
        {
            "sub": user.username,
            "role": user.role
        }
    )

    return {
    "access_token": token,
    "token_type": "bearer",
    "username": user.username,
    "role": user.role,
    "full_name": user.full_name
}


# ==========================
# Forgot / Reset Password
# ==========================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    # Always return the same response, whether or not the email is
    # registered, so this endpoint can't be used to find out which
    # emails exist in the system.
    generic_response = {
        "message": "If that email is registered, a password reset link has been sent."
    }

    if not user:
        return generic_response

    raw_token = secrets.token_urlsafe(32)

    user.reset_token = _hash_token(raw_token)
    user.reset_token_expires = datetime.utcnow() + timedelta(
        minutes=RESET_TOKEN_EXPIRE_MINUTES
    )

    db.commit()

    reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"

    try:
        send_password_reset_email(user.email, user.full_name, reset_link)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset email. Please try again later."
        )

    return generic_response


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):

    token_hash = _hash_token(request.token)

    user = db.query(User).filter(
        User.reset_token == token_hash
    ).first()

    if (
        not user
        or not user.reset_token_expires
        or user.reset_token_expires < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=400,
            detail="This reset link is invalid or has expired"
        )

    user.password_hash = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None

    db.commit()

    return {"message": "Password has been reset successfully"}