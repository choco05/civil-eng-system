from sqlalchemy import Column, Integer, String, Boolean

from app.database.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)

    course_code = Column(String, unique=True, nullable=False)

    course_name = Column(String, nullable=False)

    lecturer = Column(String, nullable=False)

    active = Column(Boolean, default=True)