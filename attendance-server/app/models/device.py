from sqlalchemy import Column, String

from app.database.database import Base


class Device(Base):
    __tablename__ = "devices"

    device_id = Column(
        String(20),
        primary_key=True
    )

    device_name = Column(
        String(100),
        nullable=False
    )

    location = Column(
        String(100),
        nullable=False
    )
