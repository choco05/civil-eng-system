from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.student_course import StudentCourse
from app.models.student import Student
from app.models.course import Course

from app.schemas.student_course import (
    StudentCourseCreate,
    StudentCourseResponse
)

router = APIRouter(
    prefix="/student-courses",
    tags=["Student Enrollments"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=list[StudentCourseResponse], include_in_schema=False)
@router.get("/", response_model=list[StudentCourseResponse])
def get_enrollments(db: Session = Depends(get_db)):

    return db.query(StudentCourse).all()

@router.post("", response_model=StudentCourseResponse, include_in_schema=False)
@router.post("/", response_model=StudentCourseResponse)
def enroll_student(
    enrollment: StudentCourseCreate,
    db: Session = Depends(get_db)
):

    student = db.query(Student).filter(
        Student.id == enrollment.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    course = db.query(Course).filter(
        Course.id == enrollment.course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    existing = db.query(StudentCourse).filter(
        StudentCourse.student_id == enrollment.student_id,
        StudentCourse.course_id == enrollment.course_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Student already enrolled in this course"
        )

    new_enrollment = StudentCourse(
        student_id=enrollment.student_id,
        course_id=enrollment.course_id
    )

    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)

    return new_enrollment

@router.get("/verify/{student_number}/{course_id}")
def verify_student_enrolment(
    student_number: str,
    course_id: int,
    db: Session = Depends(get_db)
):

    # Find the student using the university student number
    student = (
        db.query(Student)
        .filter(Student.student_id == student_number)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    enrolment = (
        db.query(StudentCourse)
        .filter(
            StudentCourse.student_id == student.id,
            StudentCourse.course_id == course_id
        )
        .first()
    )

    if enrolment is None:
        raise HTTPException(
            status_code=403,
            detail="Student is not enrolled in this course"
        )

    return {
        "enrolled": True,
        "student_id": student.student_id,
        "course_id": course_id
    }
@router.delete("/{enrollment_id}")
def remove_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db)
):

    enrollment = db.query(StudentCourse).filter(
        StudentCourse.id == enrollment_id
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found"
        )

    db.delete(enrollment)
    db.commit()

    return {
        "message": "Enrollment removed successfully"
    }

