# SRS Overall Description — Civil Engineering Attendance System

Companion to [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md). Covers the standard
SRS "Overall Description" subsections: system functions, user classes,
operating environment, design/implementation constraints, and assumptions &
dependencies. Written from the actual code in `attendance-server/` and
`dashboard/`, not a spec written in advance of it — anywhere behavior is a
known gap rather than an intended design, it's called out as such.

---

## 1. System Functions

| Function area | Description |
|---|---|
| **Authentication** | Username/password login issuing a JWT (`POST /auth/login`). Self-service "forgot password" flow: emails a time-limited (30 min), single-use reset link (`/auth/forgot-password`, `/auth/reset-password`). No public sign-up — accounts are provisioned by an admin or the `create_user.py` script. |
| **User management** | Admins create/update dashboard accounts (`/users`), assign a role (`ADMIN` or `TUTOR`), and enable/disable accounts (`active` flag blocks login). |
| **Course management** | CRUD for courses (`/courses`) plus an active/inactive toggle; inactive courses can't have new sessions created against them. |
| **Enrollment management** | Enroll/unenroll students in courses (`/student-courses`) and assign/unassign tutors to courses (`/tutor-courses`); both are many-to-many join tables with a uniqueness guard against duplicate enrollment/assignment. |
| **Session scheduling & lifecycle** | Create a scheduled class session (course, room, camera `device_id`, scheduled start/end, re-verification interval) via `/sessions`. Lifecycle is `SCHEDULED → RUNNING → FINISHED`, driven by a tutor/admin clicking Start/Finish (`/sessions/{id}/start`, `/sessions/{id}/finish`), or automatically: a background task closes any `RUNNING` session once its `scheduled_end` has passed, checking out any attendance still `ACTIVE`. At most one `RUNNING` session per course is allowed at a time. |
| **Automated attendance capture** | Recognition terminals ("cameras") call `/attendance/` on each recognition event: first recognition of a student in the currently `RUNNING` session for that `device_id` records **time-in**; subsequent recognitions update **last-seen**. `/attendance/checkout` explicitly closes out a student (time-out = last-seen). These endpoints take no dashboard credentials — they're meant to be called by an unattended device, not a logged-in person. |
| **Dashboards** | Admin summary (`/dashboard/summary`): counts of total/running sessions and present/checked-out students system-wide. Tutor summary (`/dashboard/tutor`): the same counts scoped to the tutor's own assigned courses and current session. |
| **Reporting & export** | Per-session CSV export (`/reports/download/{session_id}`), gated to `FINISHED` sessions. Bulk weekly export (`/reports/download/weekly`), scoped to the **current calendar week** (Monday 00:00 UTC to now). Bulk fortnightly export (`/reports/download/fortnightly`), a rolling 14-day window. All bulk rows include `session_id`, `session_date`, `course_code`, student id/name, attendance status, time-in/out, and method; students with no attendance record for a finished session are reported as `ABSENT`. Tutors only see their own assigned courses; admins see everything. |
| **Student roster & face enrollment** | Create/list students (`/students`) and associate an enrolled face image filename (`face_file`) per student. The server stores only the filename — it does not perform face recognition or validate the file itself. |

---

## 2. User Classes and Characteristics

| User class | Access | Characteristics |
|---|---|---|
| **Administrator** | Full access: manage users, courses, tutor assignments, enrollments; view/export all sessions and reports system-wide. | Assumed trusted staff; the only class that can create other accounts. |
| **Tutor** | Manage sessions (start/finish) and view attendance/reports only for courses they're assigned to (`tutor_courses`); cannot manage users, other tutors' assignments, or other tutors' courses. | Primary day-to-day user — starts a session at the beginning of class, finishes it (or lets it auto-close) at the end, downloads reports afterward. |
| **Student** | No login, no dashboard access, no account in `users` at all. | Purely a data subject: identified by `student_id`/enrolled face image, and shows up in the system only as attendance rows a camera produced. Any "student portal" would be new functionality, not a gap in an existing one. |
| **Recognition terminal ("camera")** | Calls `/attendance/` and `/attendance/checkout` with no authentication, identified only by a free-text `device_id`. | Not a human user — a trusted network peer. Anything on the same network that can reach the API can submit attendance as any `device_id` for whichever session is currently `RUNNING` on it; there's no per-device credential. |

Role (`ADMIN` / `TUTOR`) is a free-text column enforced only in application
code, not a database-level enum ([`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md#users) —
so a role typo or a direct DB edit produces a user that silently fails every
`current_user.role == "..."` check rather than a validation error.

---

## 3. Operating Environment

- **Backend:** Python 3.14, FastAPI 0.141 on Uvicorn (run with `--reload` in the observed dev setup), SQLAlchemy 2.0 ORM, PostgreSQL (`attendance_db`), bcrypt via Passlib, JWT via `python-jose`.
- **Frontend:** React 19 SPA (Create React App / `react-scripts`), `react-router-dom` v7, Axios.
- **Deployment topology (as configured):** one host runs both the API and the built dashboard — FastAPI serves the React production build directly (`StaticFiles` mount + a catch-all route in `main.py`) on port 8000; there is no separate frontend web server in this setup. `FRONTEND_URL` in `.env` is a LAN IP (`http://172.20.10.3:8000`), not a public domain, and CORS is opened via a regex covering private-network ranges (`192.168.*`, `10.*`, `172.16–31.*`) plus `localhost:3000` — the system is built to be reached from multiple devices on one local/campus network, not the public internet.
- **Edge hardware:** one or more face-recognition camera terminals, each configured with a fixed `device_id` string, running client software that is **not part of this repository** and POSTs to `/attendance/*` over the LAN. A `devices` catalog table exists for this but has no rows and no enforced relationship to it — see constraints below.
- **External service dependency:** outbound SMTP (Gmail, per `.env`) for password-reset emails; requires internet/SMTP egress from the host.
- **No containerization** observed (no Dockerfile/compose file) — deployed by running the Uvicorn process directly out of a Python virtualenv.

---

## 4. Design and Implementation Constraints

- **No migration tool.** Tables are created with `Base.metadata.create_all()`, which only creates tables that don't exist yet — it never alters an existing table. Every schema change after first launch (two columns' worth of foreign keys, plus `users.email`/`reset_token`/`reset_token_expires`) had to be applied by hand with `ALTER TABLE`, and the live database has already drifted from what the ORM models declare (see `DATABASE_SCHEMA.md` → Notes and known gaps). Any future schema change carries the same manual-migration risk.
- **`device_id` is an unvalidated free-text string** on both `sessions` and `attendance` — no foreign key to `devices`, no device authentication. Combined with `/attendance/*` having no auth dependency at all, anything reachable on the network can post attendance for any device/session pair.
- **Stateless JWT auth, single static secret, no refresh flow.** `SECRET_KEY` is fixed across restarts (so restarts don't invalidate tokens), but there is no server-side revocation — a token is valid for its full lifetime (currently 8 hours) regardless of logout, password change, or account deactivation in the meantime.
- **Single-process, in-process background scheduling.** The session auto-close check runs as an `asyncio` loop inside the same Uvicorn process (via `asyncio.to_thread` for the blocking DB call) rather than a separate worker/queue — it is not designed to run behind multiple app instances, which would each run their own copy of the loop.
- **Broad CORS by design.** The private-IP regex is a deliberate trade-off to let the dashboard be reached from any device on the local network without per-deployment CORS config, at the cost of not pinning to one exact origin.
- **Frontend and backend are deployed together.** Because the SPA build is served by the same FastAPI process, shipping a dashboard-only change still means rebuilding the React app into `dashboard/build` and having the backend process pick it up — there's no independently deployable frontend path in the current setup.
- **Datetime handling is inconsistent, not timezone-aware.** Code mixes `datetime.utcnow()` and `datetime.now()` (naive, no `tzinfo`) across session/attendance timestamps; correctness depends on the server and database always agreeing on one implicit timezone.

---

## 5. Assumptions and Dependencies

- Assumes PostgreSQL is already running and the `attendance_db` database already exists at `DATABASE_URL` before the app starts — `create_all()` creates tables inside a database, not the database itself.
- Assumes all accounts (admins and tutors) are provisioned out-of-band (`create_user.py` or direct admin action) — there is no public registration endpoint, so the system depends on that side channel to ever have a first admin.
- Assumes recognition terminals are trusted network peers, since `/attendance/*` requires no device credential — the system depends on network-level trust (e.g., a closed LAN) rather than application-level device authentication.
- Assumes at most one `RUNNING` session per course/device at a time; this is enforced in application logic at request time, not with a database constraint or transaction lock, so a race between two near-simultaneous "start session" requests is not guarded against.
- Assumes the server's system clock is authoritative for all scheduling and token-expiry comparisons — no client-supplied timestamp is ever trusted.
- Depends on outbound SMTP (Gmail) connectivity and valid credentials for the forgot-password flow; if unreachable, that endpoint fails closed with a 500 rather than degrading gracefully.
- Depends on an external, out-of-repo face-recognition client to (a) actually perform recognition, (b) know which `device_id` it is, and (c) load whatever file `students.face_file` names — the server only stores and returns that filename, it never validates that the file exists or matches a face.
- Depends on the pinned versions in `requirements.txt`; there is no lockfile beyond that (no Poetry/pip-tools lock), so reproducibility relies on that file staying accurate as the only source of truth for backend dependencies.
- Assumes a single-node, single-LAN deployment — `FRONTEND_URL`, the CORS allowlist, and the single Uvicorn process all assume one host address reachable by every dashboard user and every camera device on the same private network; nothing in the current design anticipates multi-region or multi-instance deployment.
