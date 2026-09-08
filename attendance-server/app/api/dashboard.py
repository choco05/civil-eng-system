from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.session import Session as SessionModel
from app.models.attendance import Attendance
from app.models.user import User
from app.models.course import Course
from app.models.tutor_course import TutorCourse
from app.models.session import Session as ClassSession


from app.security import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):

    total_sessions = db.query(SessionModel).count()

    running_sessions = db.query(SessionModel).filter(
        SessionModel.status == "RUNNING"
    ).count()

    present_students = db.query(Attendance).filter(
        Attendance.status == "ACTIVE"
    ).count()

    checked_out_students = db.query(Attendance).filter(
        Attendance.status == "CHECKED_OUT"
    ).count()

    current_session = db.query(SessionModel).filter(
        SessionModel.status == "RUNNING"
    ).first()

    return {

        "total_sessions": total_sessions,

        "running_sessions": running_sessions,

        "present_students": present_students,

        "checked_out_students": checked_out_students,

        "current_session": current_session

    }


@router.get("/tutor")
def tutor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only tutors can access
    if current_user.role != "TUTOR":
        raise HTTPException(
            status_code=403,
            detail="Tutor access only"
        )

    # Find tutor's assigned course IDs
    course_ids = (
        db.query(TutorCourse.course_id)
        .filter(TutorCourse.user_id == current_user.id)
        .all()
    )

    course_ids = [course.course_id for course in course_ids]

    # Count running sessions
    running_sessions = (
        db.query(ClassSession)
        .filter(
            ClassSession.course_id.in_(course_ids),
            ClassSession.status == "RUNNING"
        )
        .count()
    )

    current_session = (
        db.query(ClassSession)
        .filter(
            ClassSession.course_id.in_(course_ids),
            ClassSession.status == "RUNNING"
        )
        .first()
    )

    present_students = 0

    if current_session:

        present_students = (
            db.query(Attendance)
            .filter(
                Attendance.session_id == current_session.id,
                Attendance.status == "ACTIVE"
            )
            .count()
        )

    checked_out_students = 0

    if current_session:

        checked_out_students = (
            db.query(Attendance)
            .filter(
                Attendance.session_id == current_session.id,
                Attendance.status == "CHECKED_OUT"
            )
            .count()
        )

    course = None

    if current_session:

        course = (
            db.query(Course)
            .filter(Course.id == current_session.course_id)
            .first()
        )

    return {

        "running_sessions": running_sessions,

        "present_students": present_students,

        "checked_out_students": checked_out_students,

        "current_session": None if current_session is None else {

            "course": f"{course.course_code} - {course.course_name}",

            "room": current_session.room,

            "device_id": current_session.device_id,

            "status": current_session.status

        }

    }

    
    