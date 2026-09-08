from pydantic import BaseModel


class TutorCourseBase(BaseModel):
    user_id: int
    course_id: int


class TutorCourseCreate(TutorCourseBase):
    pass


class TutorCourseResponse(TutorCourseBase):
    id: int

    class Config:
        from_attributes = True