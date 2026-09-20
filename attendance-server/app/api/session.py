from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.course import Course
from app.database.database import SessionLocal
from app.models.session import Session as ClassSession
from app.schemas.session import SessionCreate, SessionResponse
from datetime import datetime
from app.models.user import User
from app.models.tutor_course import TutorCourse
from app.security import get_current_user
from app.models.attendance import Attendance

router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# Create Session
# -------------------------
@router.post("/", response_model=SessionResponse)
def create_session(
    session: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check that the course exists
    course = db.query(Course).filter(
        Course.id == session.course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    # Check that the course is active
    if not course.active:
        raise HTTPException(
            status_code=400,
            detail="Course is inactive"
        )

    # Prevent multiple active sessions for the same course
    existing = db.query(ClassSession).filter(
        ClassSession.course_id == session.course_id,
        ClassSession.status == "RUNNING"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Course already has an active session"
        )


    # Tutors may only create sessions for their assigned courses
    if current_user.role == "TUTOR":

        assignment = (
            db.query(TutorCourse)
            .filter(
                TutorCourse.user_id == current_user.id,
                TutorCourse.course_id == session.course_id
            )
            .first()
        )

        if assignment is None:
            raise HTTPException(
                status_code=403,
                detail="Tutor is not assigned to this course"
            )
            
    new_session = ClassSession(
        course_id=session.course_id,
        room=session.room,
        device_id=session.device_id,
        scheduled_start=session.scheduled_start,
        scheduled_end=session.scheduled_end,
        verification_interval=session.verification_interval
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


# -------------------------
# Get All Sessions
# -------------------------
@router.get("", response_model=list[SessionResponse], include_in_schema=False)
@router.get("/", response_model=list[SessionResponse])
def get_sessions(
    db: Session = Depends(get_db)
):

    return db.query(ClassSession).all()

@router.get("/my")
def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Admin can view every session
    if current_user.role == "ADMIN":
        return db.query(ClassSession).all()

    # Tutor: find assigned courses
    assigned_courses = (
        db.query(TutorCourse.course_id)
        .filter(TutorCourse.user_id == current_user.id)
        .all()
    )

    course_ids = [course.course_id for course in assigned_courses]

    # No assigned courses
    if not course_ids:
        return []

    # Return only tutor's sessions
    sessions = (
        db.query(ClassSession)
        .filter(ClassSession.course_id.in_(course_ids))
        .all()
    )

    return sessions


# -------------------------
# Get One Session
# -------------------------
@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db)
):

    session = db.query(ClassSession).filter(
        ClassSession.id == session_id
    ).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found."
        )



@router.get("/active/{device_id}", response_model=SessionResponse)
def get_active_session(
    device_id: str,
    db: Session = Depends(get_db)
):

    session = (
        db.query(ClassSession)
        .filter(
            ClassSession.device_id == device_id,
            ClassSession.status == "RUNNING"
        )
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="No active session for this camera"
        )

    return session



@router.put("/{session_id}/start")
def start_session(
    session_id: int,
    db: Session = Depends(get_db)
):

    session = db.query(ClassSession).filter(
        ClassSession.id == session_id
    ).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found."
        )

    session.status = "RUNNING"
    session.actual_start = datetime.now()
    db.commit()
    db.refresh(session)

    return session

def _finish_session(db: Session, session: ClassSession):
    """Mark a session finished and check out any still-active attendance."""

    session.status = "FINISHED"
    session.actual_end = datetime.now()

    active_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.session_id == session.id,
            Attendance.status == "ACTIVE"
        )
        .all()
    )

    for record in active_attendance:
        record.status = "CHECKED_OUT"
        record.time_out = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return session


def close_expired_sessions(db: Session):
    """Auto-finish any RUNNING session whose scheduled end time has passed."""

    expired_sessions = (
        db.query(ClassSession)
        .filter(
            ClassSession.status == "RUNNING",
            ClassSession.scheduled_end <= datetime.now()
        )
        .all()
    )

    for session in expired_sessions:
        _finish_session(db, session)

    return expired_sessions


@router.put("/{session_id}/finish")
def finish_session(
    session_id: int,
    db: Session = Depends(get_db)
):

    session = db.query(ClassSession).filter(
        ClassSession.id == session_id
    ).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found."
        )

    return _finish_session(db, session)