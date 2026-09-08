from datetime import datetime
from pydantic import BaseModel


class AttendanceCreate(BaseModel):
    student_id: str
    device_id: str = "CAMERA-01"

class AttendanceCheckout(BaseModel):
    student_id: str
    device_id: str
    
class AttendanceResponse(BaseModel):
    id: int
    student_id: str
    session_id: int

    time_in: datetime | None = None
    time_out: datetime | None = None
    last_seen: datetime | None = None

    status: str
    method: str
    device_id: str
    session_status: str | None = None
    session_date: datetime | None = None
    course_code: str | None = None

    class Config:
        from_attributes = True