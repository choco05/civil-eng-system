from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):

    username: str
    password: str
    full_name: str
    email: EmailStr
    role: str


class UserUpdate(BaseModel):

    full_name: str
    email: EmailStr
    role: str
    password: Optional[str] = None


class UserResponse(BaseModel):

    id: int

    username: str
    full_name: str
    email: Optional[str] = None
    role: str
    active: bool

    class Config:
        from_attributes = True

class UserStatusUpdate(BaseModel):

    active: bool