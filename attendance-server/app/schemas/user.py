from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class UserCreate(BaseModel):

    username: str
    password: str
    full_name: str
    email: EmailStr
    role: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserUpdate(BaseModel):

    full_name: str
    email: EmailStr
    role: str
    password: Optional[str] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


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