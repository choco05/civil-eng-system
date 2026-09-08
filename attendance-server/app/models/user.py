from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, nullable=False)

    password_hash = Column(String, nullable=False)

    full_name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=True)

    role = Column(String, nullable=False)

    active = Column(Boolean, default=True)

    reset_token = Column(String, nullable=True)

    reset_token_expires = Column(DateTime, nullable=True)