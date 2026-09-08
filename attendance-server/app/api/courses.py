from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.tutor_course import TutorCourse
from app.models.user import User
from app.security import get_current_user
from app.database.database import SessionLocal
from app.models.course import Course
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseStatusUpdate
)

router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=list[CourseResponse], include_in_schema=False)
@router.get("/", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.get("/my")
def get_my_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Admin sees all active courses
    if current_user.role == "ADMIN":

        return db.query(Course).filter(
            Course.active == True
        ).all()

    # Tutors only see assigned courses
    courses = (
        db.query(Course)
        .join(
            TutorCourse,
            TutorCourse.course_id == Course.id
        )
        .filter(
            TutorCourse.user_id == current_user.id,
            Course.active == True
        )
        .all()
    )

    return courses

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):

    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return course



@router.post("", response_model=CourseResponse, include_in_schema=False)
@router.post("/", response_model=CourseResponse)
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Course).filter(
        Course.course_code == course.course_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Course code already exists"
        )

    new_course = Course(
        course_code=course.course_code,
        course_name=course.course_name,
        lecturer=course.lecturer,
        active=True
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return new_course

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course: CourseUpdate,
    db: Session = Depends(get_db)
):

    existing = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    existing.course_code = course.course_code
    existing.course_name = course.course_name
    existing.lecturer = course.lecturer

    db.commit()
    db.refresh(existing)

    return existing

@router.patch("/{course_id}/status",
              response_model=CourseResponse)
def update_course_status(
    course_id: int,
    status: CourseStatusUpdate,
    db: Session = Depends(get_db)
):

    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    course.active = status.active

    db.commit()
    db.refresh(course)

    return course

