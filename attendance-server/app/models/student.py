from sqlalchemy import Column, Integer, String
from app.database.database import Base

class Student(Base):
	__tablename__ = "students"

	id = Column(Integer,primary_key=True, index=True)
	student_id = Column(String(20), unique=True, nullable=False)
	name = Column(String(100), nullable=False)
	face_file = Column(String(255), nullable=True)
