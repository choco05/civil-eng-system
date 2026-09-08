from app.database.database import SessionLocal
from app.models.user import User
from app.security import hash_password

db = SessionLocal()


def create_user(username, password, full_name, email, role):

    existing = db.query(User).filter(
        User.username == username
    ).first()

    if existing:
        print(f"{username} already exists.")
        return

    user = User(
        username=username,
        password_hash=hash_password(password),
        full_name=full_name,
        email=email,
        role=role,
        active=True
    )

    db.add(user)
    db.commit()

    print(f"{username} created successfully.")


create_user(
    "admin",
    "admin123",
    "System Administrator",
    "admin@example.com",
    "ADMIN"
)

create_user(
    "tutor1",
    "tutor123",
    "John Tutor",
    "tutor1@example.com",
    "TUTOR"
)

db.close()