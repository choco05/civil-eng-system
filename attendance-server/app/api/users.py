from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserStatusUpdate
from app.database.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.security import hash_password

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[UserResponse], include_in_schema=False)
@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):

    return db.query(User).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user

@router.post("", response_model=UserResponse, include_in_schema=False)
@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate,
                db: Session = Depends(get_db)):

    existing = db.query(User).filter(
        User.username == user.username
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already in use"
        )

    new_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int,
                user: UserUpdate,
                db: Session = Depends(get_db)):

    existing = db.query(User).filter(
        User.id == user_id
    ).first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    duplicate_email = db.query(User).filter(
        User.email == user.email,
        User.id != user_id
    ).first()

    if duplicate_email:
        raise HTTPException(
            status_code=400,
            detail="Email already in use"
        )

    existing.full_name = user.full_name
    existing.email = user.email
    existing.role = user.role

    if user.password:
        existing.password_hash = hash_password(user.password)

    db.commit()
    db.refresh(existing)

    return existing

@router.patch("/{user_id}/status",
              response_model=UserResponse)
def update_status(user_id: int,
                  status: UserStatusUpdate,
                  db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.active = status.active

    db.commit()
    db.refresh(user)

    return user