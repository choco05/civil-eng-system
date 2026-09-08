from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.schemas.attendance import AttendanceResponse
from app.models.user import User
from app.models.tutor_course import TutorCourse
from app.models.session import Session as ClassSession
from app.models.attendance import Attendance
from app.models.course import Course
import csv
import io
from datetime import datetime, timedelta

from fastapi.responses import StreamingResponse

from app.models.student import Student
from app.models.student_course import StudentCourse

from app.security import get_current_user

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


# ============================
# Database Dependency
# ============================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _attach_session_status(reports: list[Attendance], db: Session):
    """Attach each session's status/date/course onto its attendance records
    so the frontend can tell which sessions are downloadable (FINISHED) and
    group them without a second round trip."""

    session_ids = {report.session_id for report in reports}

    sessions = (
        db.query(ClassSession)
        .filter(ClassSession.id.in_(session_ids))
        .all()
    )

    course_ids = {session.course_id for session in sessions}

    courses = (
        db.query(Course)
        .filter(Course.id.in_(course_ids))
        .all()
    )

    course_code_by_id = {course.id: course.course_code for course in courses}

    session_by_id = {session.id: session for session in sessions}

    for report in reports:
        session = session_by_id.get(report.session_id)
        report.session_status = session.status if session else None
        report.session_date = session.scheduled_start if session else None
        report.course_code = (
            course_code_by_id.get(session.course_id) if session else None
        )


def _scoped_course_ids(current_user: User, db: Session):
    """Returns the list of course ids a user's bulk reports should cover,
    or None for admins (meaning: every course)."""

    if current_user.role == "ADMIN":
        return None

    if current_user.role == "TUTOR":
        rows = (
            db.query(TutorCourse.course_id)
            .filter(TutorCourse.user_id == current_user.id)
            .all()
        )
        return [row.course_id for row in rows]

    raise HTTPException(status_code=403, detail="Not authorized")


def _bulk_report_rows(course_ids, since, db: Session):
    """Builds one row per enrolled student per finished session (present or
    absent) across every course in scope since the given cutoff."""

    sessions_query = db.query(ClassSession).filter(
        ClassSession.status == "FINISHED",
        ClassSession.scheduled_start >= since
    )

    if course_ids is not None:
        sessions_query = sessions_query.filter(
            ClassSession.course_id.in_(course_ids)
        )

    sessions = sessions_query.order_by(ClassSession.scheduled_start).all()

    if not sessions:
        return []

    courses = (
        db.query(Course)
        .filter(Course.id.in_({session.course_id for session in sessions}))
        .all()
    )
    course_by_id = {course.id: course for course in courses}

    attendance_records = (
        db.query(Attendance)
        .filter(Attendance.session_id.in_([session.id for session in sessions]))
        .all()
    )

    attendance_by_session = {}
    for record in attendance_records:
        attendance_by_session.setdefault(record.session_id, {})[
            record.student_id
        ] = record

    rows = []

    for session in sessions:

        course = course_by_id.get(session.course_id)

        students = (
            db.query(Student)
            .join(StudentCourse, Student.id == StudentCourse.student_id)
            .filter(StudentCourse.course_id == session.course_id)
            .all()
        )

        attendance_lookup = attendance_by_session.get(session.id, {})

        for student in students:

            attendance = attendance_lookup.get(student.student_id)

            rows.append({
                "session_date": session.scheduled_start.strftime("%Y-%m-%d"),
                "course_code": course.course_code if course else "",
                "student_id": student.student_id,
                "name": student.name,
                "status": attendance.status if attendance else "ABSENT",
                "time_in": attendance.time_in if attendance else None,
                "time_out": attendance.time_out if attendance else None,
                "method": attendance.method if attendance else None
            })

    return rows


def _download_bulk_report(current_user: User, db: Session, days: int, label: str):

    if current_user.role not in ("ADMIN", "TUTOR"):
        raise HTTPException(
            status_code=403,
            detail="Tutor or admin access only"
        )

    course_ids = _scoped_course_ids(current_user, db)
    since = datetime.utcnow() - timedelta(days=days)
    rows = _bulk_report_rows(course_ids, since, db)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No finished sessions in the last {days} days"
        )

    buffer = io.StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=[
            "session_date", "course_code", "student_id",
            "name", "status", "time_in", "time_out", "method"
        ]
    )
    writer.writeheader()
    writer.writerows(rows)
    buffer.seek(0)

    filename = f"Attendance_Report_{label}_{datetime.utcnow().date()}.csv"

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# ============================
# Tutor Reports Summary
# ============================

@router.get(
    "",
    response_model=list[AttendanceResponse]
)
def get_all_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only administrators can view all reports
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Administrator access only"
        )

    reports = (
        db.query(Attendance)
        .order_by(Attendance.id.desc())
        .all()
    )

    _attach_session_status(reports, db)

    return reports


@router.get(
    "/my",
    response_model=list[AttendanceResponse]
)
def tutor_report_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "TUTOR":
        raise HTTPException(
            status_code=403,
            detail="Tutor access only"
        )

   # Tutor's assigned courses
    course_ids = (
    db.query(TutorCourse.course_id)
    .filter(TutorCourse.user_id == current_user.id)
    .all()
    )

    course_ids = [course.course_id for course in course_ids]

    # Tutor's sessions
    session_ids = (
        db.query(ClassSession.id)
        .filter(ClassSession.course_id.in_(course_ids))
        .all()
    )

    session_ids = [session.id for session in session_ids]

    # Attendance records for those sessions
    reports = (
        db.query(Attendance)
        .filter(
            Attendance.session_id.in_(session_ids)
        )
        .all()
    )

    _attach_session_status(reports, db)

    return reports

@router.get("/download/weekly")
def download_weekly_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _download_bulk_report(current_user, db, days=7, label="Weekly")


@router.get("/download/fortnightly")
def download_fortnightly_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _download_bulk_report(current_user, db, days=14, label="Fortnightly")


@router.get("/download/{session_id}")
def download_report(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only tutors and admins can download reports
    if current_user.role not in ("TUTOR", "ADMIN"):
        raise HTTPException(
            status_code=403,
            detail="Tutor or admin access only"
        )

    # Find the session
    session = (
        db.query(ClassSession)
        .filter(ClassSession.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    # Tutors may only export sessions from their own assigned courses
    if current_user.role == "TUTOR":

        tutor_course = (
            db.query(TutorCourse)
            .filter(
                TutorCourse.user_id == current_user.id,
                TutorCourse.course_id == session.course_id
            )
            .first()
        )

        if not tutor_course:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this course"
            )

    # Only finished sessions can be exported
    if session.status != "FINISHED":
        raise HTTPException(
            status_code=400,
            detail="Session must be FINISHED before downloading a report"
        )

    # Get all students enrolled in this course
    students = (
        db.query(Student)
        .join(
            StudentCourse,
            Student.id == StudentCourse.student_id
        )
        .filter(
            StudentCourse.course_id == session.course_id
        )
        .all()
    )

    # Attendance records for this session
    attendance_records = (
        db.query(Attendance)
        .filter(
            Attendance.session_id == session.id
        )
        .all()
    )

    # Create a lookup dictionary
    attendance_lookup = {
        attendance.student_id: attendance
        for attendance in attendance_records
    }

    report = []

    for student in students:

        attendance = attendance_lookup.get(student.student_id)

        if attendance:

            report.append({
                "student_id": student.student_id,
                "name": student.name,
                "status": attendance.status,
                "time_in": attendance.time_in,
                "time_out": attendance.time_out,
                "method": attendance.method
            })

        else:

            report.append({
                "student_id": student.student_id,
                "name": student.name,
                "status": "ABSENT",
                "time_in": None,
                "time_out": None,
                "method": None
            })

    buffer = io.StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=["student_id", "name", "status", "time_in", "time_out", "method"]
    )
    writer.writeheader()
    writer.writerows(report)
    buffer.seek(0)

    filename = f"Attendance_Report_Session_{session_id}.csv"

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )