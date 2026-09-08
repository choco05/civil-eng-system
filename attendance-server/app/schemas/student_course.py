from pydantic import BaseModel


class StudentCourseBase(BaseModel):
    student_id: int
    course_id: int


class StudentCourseCreate(StudentCourseBase):
    pass


class StudentCourseResponse(StudentCourseBase):
    id: int

    class Config:
        from_attributes = True