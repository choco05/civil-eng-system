from pydantic import BaseModel

class FaceFileUpdate(BaseModel):
    face_file: str

class StudentCreate(BaseModel):
    student_id: str
    name: str


class StudentResponse(BaseModel):
    id: int
    student_id: str
    name: str
    face_file: str | None = None

    model_config = {
        "from_attributes": True
    }
