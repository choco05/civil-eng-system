from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentResponse
from app.schemas.student import FaceFileUpdate



router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):

    existing = db.query(Student).filter(
        Student.student_id == student.student_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Student ID already exists."
        )

    new_student = Student(
        student_id=student.student_id,
        name=student.name
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student


@router.get("", response_model=list[StudentResponse], include_in_schema=False)
@router.get("/", response_model=list[StudentResponse])
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):

    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

@router.put("/{student_id}/face")
def update_face_file(student_id: str, data: FaceFileUpdate):

    db = SessionLocal()

    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if not student:
        db.close()
        raise HTTPException(status_code=404, detail="Student not found")

    student.face_file = data.face_file

    db.commit()
    db.refresh(student)

    db.close()

    return {
        "message": "Face registration updated successfully.",
        "student": student
    }

    return student
