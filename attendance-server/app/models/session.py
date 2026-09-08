from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy import ForeignKey
from app.database.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    
    room = Column(
        String(50),
        nullable=False
    )

    device_id = Column(
        String(20),
        nullable=False
    )

    # Timetable
    scheduled_start = Column(
        DateTime,
        nullable=False
    )

    scheduled_end = Column(
        DateTime,
        nullable=False
    )

    # Actual class times
    actual_start = Column(
        DateTime,
        nullable=True
    )

    actual_end = Column(
        DateTime,
        nullable=True
    )

    verification_interval = Column(
    Integer,
    default=30
)

    status = Column(
        String(20),
        default="SCHEDULED"
    )

    course_id = Column(
    Integer,
    ForeignKey("courses.id"),
    nullable=False
)