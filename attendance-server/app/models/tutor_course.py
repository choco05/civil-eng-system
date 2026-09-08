from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    UniqueConstraint
)

from app.database.database import Base


class TutorCourse(Base):
    __tablename__ = "tutor_courses"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "course_id",
            name="uq_tutor_course"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )