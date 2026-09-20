import asyncio
import logging

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import Base, engine, SessionLocal
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.device import Device
from app.models.session import Session
from app.models.user import User
from app.models.course import Course
from app.models.tutor_course import TutorCourse
from app.models.student_course import StudentCourse

from app.api.tutor_courses import router as tutor_courses_router
from app.api.attendance import router as attendance_router
from app.api.student import router as student_router
from app.api.session import router as session_router
from app.api.session import close_expired_sessions
from app.api.dashboard import router as dashboard_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.courses import router as courses_router
from app.api.student_courses import router as student_courses_router
from app.api.reports import router as reports_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
	title="Civil engineering Attendance API",
	version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student_router)
app.include_router(attendance_router)
app.include_router(session_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(student_courses_router)
app.include_router(tutor_courses_router)
app.include_router(reports_router)

# ===========================
# Auto-close expired sessions
# ===========================

SESSION_CHECK_INTERVAL_SECONDS = 30

logger = logging.getLogger("uvicorn.error")


def _close_expired_sessions_sync():
    db = SessionLocal()
    try:
        closed = close_expired_sessions(db)
        for session in closed:
            logger.info(
                "Auto-closed session %s (scheduled_end=%s)",
                session.id,
                session.scheduled_end,
            )
    finally:
        db.close()


async def _session_auto_close_loop():
    while True:
        try:
            await asyncio.to_thread(_close_expired_sessions_sync)
        except Exception:
            logger.exception("Failed to auto-close expired sessions")
        await asyncio.sleep(SESSION_CHECK_INTERVAL_SECONDS)


@app.on_event("startup")
async def start_session_auto_close_task():
    asyncio.create_task(_session_auto_close_loop())


# ===========================
# React Dashboard
# ===========================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

dashboard_path = BASE_DIR / "dashboard" / "build"

app.mount(
    "/static",
    StaticFiles(directory=dashboard_path / "static"),
    name="static"
)


@app.get("/")
def serve_dashboard():
    return FileResponse(dashboard_path / "index.html")


@app.get("/{full_path:path}")
def serve_dashboard_routes(full_path: str):
    """
    Catch-all for React Router's client-side routes (e.g. /login, /students).
    Without this, a direct hit or browser refresh on those paths 404s at the
    server before React ever loads to take over routing.

    Real build assets (favicon, manifest, images copied from public/) live
    alongside index.html in this same folder, so check for those first —
    otherwise every image request just gets index.html back instead of the
    actual file.
    """
    candidate = dashboard_path / full_path

    if candidate.is_file():
        return FileResponse(candidate)

    return FileResponse(dashboard_path / "index.html")



