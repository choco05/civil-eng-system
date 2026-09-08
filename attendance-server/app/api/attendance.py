from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.database import SessionLocal
from app.models.attendance import Attendance
from app.models.student import Student
from app.schemas.attendance import (AttendanceCreate, AttendanceResponse, AttendanceCheckout)
from app.models.session import Session as ClassSession
from app.models.user import User
from app.models.tutor_course import TutorCourse
from app.models.student_course import StudentCourse
from app.security import get_current_user


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@router.post("/")
def mark_attendance(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db)
):

    # Verify student exists
    student = db.query(Student).filter(
        Student.student_id == attendance.student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    # Find the currently running session for this camera
    running_session = db.query(ClassSession).filter(
        ClassSession.device_id == attendance.device_id,
        ClassSession.status == "RUNNING"
    ).first()

    if running_session is None:
        raise HTTPException(
            status_code=404,
            detail="No running session found for this camera."
        )

    # Check if this student already has attendance for this session
    existing = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        Attendance.session_id == running_session.id
    ).first()
    

    # ---------------------------------------
    # FIRST SCAN → TIME IN
    # ---------------------------------------
    if existing is None:

        record = Attendance(
            student_id=attendance.student_id,
            session_id=running_session.id,

            time_in=datetime.now(),
            last_seen=datetime.now(),

            status="ACTIVE",

            device_id=attendance.device_id
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "status": "time_in",
            "message": "Time In Recorded",
            "attendance": record
        }

    # ---------------------------------------
    # SECOND SCAN → TIME OUT
    # ---------------------------------------
    existing.last_seen = datetime.now()

    db.commit()
    db.refresh(existing)

    return {
        "status": "updated",
        "message": "Last Seen Updated",
        "attendance": existing
    }

@router.put("/checkout")
def checkout_student(
    checkout: AttendanceCheckout,
    db: Session = Depends(get_db)
):

    # Find the running session
    running_session = db.query(ClassSession).filter(
        ClassSession.device_id == checkout.device_id,
        ClassSession.status == "RUNNING"
    ).first()

    if running_session is None:
        raise HTTPException(
            status_code=404,
            detail="No running session found."
        )

    # Find the student's active attendance
    record = db.query(Attendance).filter(
        Attendance.student_id == checkout.student_id,
        Attendance.session_id == running_session.id,
        Attendance.status == "ACTIVE"
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Active attendance record not found."
        )

    # Time Out becomes the previous Last Seen
    record.time_out = record.last_seen
    record.status = "CHECKED_OUT"

    db.commit()
    db.refresh(record)

    return {
        "status": "checked_out",
        "message": "Student checked out successfully.",
        "attendance": record
    }

    
@router.get("/", response_model=list[AttendanceResponse])
def get_attendance(db: Session = Depends(get_db)):
    return db.query(Attendance).all()

@router.get("/my")
def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Admin sees all attendance
    if current_user.role == "ADMIN":
        return db.query(Attendance).all()

    # Get tutor's assigned courses
    assigned_courses = (
        db.query(TutorCourse.course_id)
        .filter(TutorCourse.user_id == current_user.id)
        .all()
    )

    course_ids = [course.course_id for course in assigned_courses]

    if not course_ids:
        return []

    # Find students enrolled in tutor's courses
    student_ids = (
        db.query(Student.student_id)
        .join(
            StudentCourse,
            StudentCourse.student_id == Student.id
        )
        .filter(
            StudentCourse.course_id.in_(course_ids)
        )
        .all()
    )

    student_ids = [student.student_id for student in student_ids]

    if not student_ids:
        return []

    attendance = (
        db.query(Attendance)
        .join(
            ClassSession,
            Attendance.session_id == ClassSession.id
        )
        .filter(
            ClassSession.course_id.in_(course_ids)
        )
        .all()
    )

    return attendance


@router.get("/live", response_model=list[AttendanceResponse])
def get_live_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attendance for the tutor's currently RUNNING session only, so the
    dashboard shows just the students attending right now instead of every
    historical record."""

    if current_user.role != "TUTOR":
        raise HTTPException(
            status_code=403,
            detail="Tutor access only"
        )

    course_ids = (
        db.query(TutorCourse.course_id)
        .filter(TutorCourse.user_id == current_user.id)
        .all()
    )

    course_ids = [course.course_id for course in course_ids]

    if not course_ids:
        return []

    current_session = (
        db.query(ClassSession)
        .filter(
            ClassSession.course_id.in_(course_ids),
            ClassSession.status == "RUNNING"
        )
        .first()
    )

    if current_session is None:
        return []

    return (
        db.query(Attendance)
        .filter(Attendance.session_id == current_session.id)
        .all()
    )


@router.get("/{student_id}", response_model=list[AttendanceResponse])
def get_student_attendance(
    student_id: str,
    db: Session = Depends(get_db)
):

    return db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).all()