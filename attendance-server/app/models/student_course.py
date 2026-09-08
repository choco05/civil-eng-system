from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    UniqueConstraint
)

from app.database.database import Base


class StudentCourse(Base):
    __tablename__ = "student_courses"

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "course_id",
            name="uq_student_course"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )

    