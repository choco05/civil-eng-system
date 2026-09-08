from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    # Student
    student_id = Column(
        String(20),
        ForeignKey("students.student_id"),
        nullable=False
    )

    # Tutorial/Class Session
    session_id = Column(
        Integer,
        ForeignKey("sessions.id"),
        nullable=False
    )

    # First successful recognition
    time_in = Column(
        DateTime,
        nullable=True
    )

    # Automatically calculated when student disappears
    time_out = Column(
        DateTime,
        nullable=True
    )

    # Last successful recognition
    last_seen = Column(
        DateTime,
        nullable=True
    )

    # ACTIVE | CHECKED_OUT | COMPLETED | ABSENT
    status = Column(
        String(20),
        default="ACTIVE"
    )

    method = Column(
        String(20),
        default="Face"
    )

    device_id = Column(
        String(20),
        nullable=False
    )