from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):

    course_id: int

    room: str
    device_id: str

    scheduled_start: datetime
    scheduled_end: datetime

    verification_interval: int = 30


class SessionResponse(BaseModel):

    id: int

    course_id: int

    room: str
    device_id: str

    scheduled_start: datetime
    scheduled_end: datetime

    actual_start: datetime | None = None
    actual_end: datetime | None = None

    verification_interval: int

    status: str

    class Config:
        from_attributes = True