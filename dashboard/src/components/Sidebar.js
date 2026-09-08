import { NavLink } from "react-router-dom";
import BrandLogo from "./BrandLogo";

function Sidebar() {

    const role = localStorage.getItem("role");

    const linkClass = ({ isActive }) =>
        "sidebar-link" + (isActive ? " sidebar-link-active" : "");

    return (

        <div className="sidebar">

            <div className="sidebar-brand">
                <BrandLogo height={36} onDark showAppName stacked />
            </div>

            <div className="sidebar-section-label">Overview</div>

            <NavLink to="/" end className={linkClass}>
                <span className="sidebar-icon">📊</span> Dashboard
            </NavLink>

            <NavLink to="/sessions" className={linkClass}>
                <span className="sidebar-icon">📚</span> Sessions
            </NavLink>

            <NavLink to="/attendance" className={linkClass}>
                <span className="sidebar-icon">📝</span> Attendance
            </NavLink>

            <NavLink to="/reports" className={linkClass}>
                <span className="sidebar-icon">📈</span> Reports
            </NavLink>

            {role === "ADMIN" && (
                <>
                    <div className="sidebar-section-label">Administration</div>

                    <NavLink to="/students" className={linkClass}>
                        <span className="sidebar-icon">🎓</span> Students
                    </NavLink>

                    <NavLink to="/courses" className={linkClass}>
                        <span className="sidebar-icon">📖</span> Courses
                    </NavLink>

                    <NavLink to="/enrollments" className={linkClass}>
                        <span className="sidebar-icon">🗂️</span> Enrollments
                    </NavLink>

                    <NavLink to="/tutor-assignments" className={linkClass}>
                        <span className="sidebar-icon">🧑‍🏫</span> Tutor Assignments
                    </NavLink>

                    <NavLink to="/users" className={linkClass}>
                        <span className="sidebar-icon">👥</span> Users
                    </NavLink>
                </>
            )}

            <div className="sidebar-footer">
                <div className="sidebar-role-badge">{role}</div>
            </div>

        </div>

    );

}

export default Sidebar;
