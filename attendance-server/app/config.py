import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/attendance_db"
)

# ==========================
# JWT Signing Secret
# ==========================

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-insecure-secret-change-me")

# ==========================
# Email / SMTP Configuration
# (used for password reset emails)
# ==========================

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Civil Engineering Attendance System")

# Base URL of the dashboard, used to build the link inside reset emails
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
