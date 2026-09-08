import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PAGE_TITLES = {
    "/": "Dashboard",
    "/sessions": "Sessions",
    "/students": "Students",
    "/attendance": "Attendance",
    "/reports": "Reports",
    "/users": "Users",
    "/courses": "Course Management",
    "/enrollments": "Enrollments",
    "/tutor-assignments": "Tutor Assignments"
};

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

function Header() {
    const today = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const navigate = useNavigate();
    const location = useLocation();
    const fullName = localStorage.getItem("full_name");
    const role = localStorage.getItem("role");

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("full_name");

        navigate("/login");
    };

    const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

    return (

        <div className="header">

            <div>
                <h1>{pageTitle}</h1>
                <small>{today}</small>
            </div>

            <div className="header-user">

                <div className="header-user-avatar">
                    {getInitials(fullName)}
                </div>

                <div className="header-user-info">
                    <div className="header-user-name">{fullName}</div>
                    <div className="header-user-role">{role}</div>
                </div>

                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="header-logout-btn"
                >
                    Logout
                </button>

            </div>

            {showLogoutConfirm && (

                <div
                    className="modal-overlay"
                    onClick={() => setShowLogoutConfirm(false)}
                >

                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h3 className="modal-title">
                            Log out?
                        </h3>

                        <p className="modal-body">
                            Are you sure you want to logout?
                        </p>

                        <div className="modal-actions">

                            <button
                                className="modal-btn modal-btn-cancel"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="modal-btn modal-btn-danger"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}

export default Header;
