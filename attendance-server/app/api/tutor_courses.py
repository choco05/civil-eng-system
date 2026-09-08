from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.tutor_course import TutorCourse
from app.models.user import User
from app.models.course import Course

from app.schemas.tutor_course import (
    TutorCourseCreate,
    TutorCourseResponse
)

router = APIRouter(
    prefix="/tutor-courses",
    tags=["Tutor Assignments"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=list[TutorCourseResponse], include_in_schema=False)
@router.get("/", response_model=list[TutorCourseResponse])
def get_assignments(db: Session = Depends(get_db)):
    return db.query(TutorCourse).all()

@router.post("", response_model=TutorCourseResponse, include_in_schema=False)
@router.post("/", response_model=TutorCourseResponse)
def assign_tutor(
    assignment: TutorCourseCreate,
    db: Session = Depends(get_db)
):

    tutor = db.query(User).filter(
        User.id == assignment.user_id
    ).first()

    if not tutor:
        raise HTTPException(
            status_code=404,
            detail="Tutor not found"
        )

    if tutor.role != "TUTOR":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a tutor"
        )

    course = db.query(Course).filter(
        Course.id == assignment.course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    existing = db.query(TutorCourse).filter(
        TutorCourse.user_id == assignment.user_id,
        TutorCourse.course_id == assignment.course_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tutor already assigned to this course"
        )

    new_assignment = TutorCourse(
        user_id=assignment.user_id,
        course_id=assignment.course_id
    )

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment


@router.delete("/{assignment_id}")
def remove_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):

    assignment = db.query(TutorCourse).filter(
        TutorCourse.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    db.delete(assignment)
    db.commit()

    return {
        "message": "Tutor assignment removed successfully"
    }