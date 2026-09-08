from pydantic import BaseModel


class CourseBase(BaseModel):
    course_code: str
    course_name: str
    lecturer: str


class CourseCreate(CourseBase):
    pass


class CourseUpdate(CourseBase):
    pass


class CourseStatusUpdate(BaseModel):
    active: bool


class CourseResponse(CourseBase):
    id: int
    active: bool

    class Config:
        from_attributes = True