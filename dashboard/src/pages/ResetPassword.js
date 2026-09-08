import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";


function ResetPassword() {

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        setSubmitting(true);
        setMessage("");

        try {

            await api.post("/auth/reset-password", {
                token,
                new_password: newPassword
            });

            setSuccess(true);
            setMessage("Your password has been reset. You can now log in.");

        } catch (error) {

            setMessage(
                error.response?.data?.detail ||
                "This reset link is invalid or has expired."
            );

        } finally {

            setSubmitting(false);

        }

    };

    return (

        <div className="login-page">

            <div className="login-brand-panel">

                <div
                    className="login-brand-pattern"
                    style={{ backgroundImage: "url(/coconut.png)" }}
                ></div>

                <div className="login-brand-content">

                    <img
                        src="/coconut.png"
                        alt="USP mark"
                        className="login-brand-mark"
                    />

                    <div className="login-brand-title">
                        University Attendance System
                    </div>

                    <div className="login-brand-subtitle">
                        Civil Engineering Department
                    </div>

                </div>

            </div>

            <div className="login-form-panel">

                <div className="login-form-card">

                    <h2 className="login-form-heading">
                        Choose a new password
                    </h2>

                    {!token && (
                        <p className="login-form-subheading">
                            This reset link is missing its token. Please use
                            the link from your email.
                        </p>
                    )}

                    {token && !success && (

                    <form onSubmit={handleSubmit}>

                        <label className="login-label">
                            New Password
                        </label>

                        <input
                            type="password"
                            className="login-input"
                            value={newPassword}
                            required
                            minLength={6}
                            onChange={(e)=>setNewPassword(e.target.value)}
                        />

                        <label className="login-label">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            className="login-input"
                            value={confirmPassword}
                            required
                            minLength={6}
                            onChange={(e)=>setConfirmPassword(e.target.value)}
                        />

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? "Resetting..." : "Reset password"}
                        </button>

                    </form>

                    )}

                    {message && (
                        <p style={{ marginTop: "16px", textAlign: "center" }}>
                            {message}
                        </p>
                    )}

                    {success && (
                        <p style={{ marginTop: "16px", textAlign: "center" }}>
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="login-submit-btn"
                            >
                                Go to login
                            </button>
                        </p>
                    )}

                </div>

            </div>

        </div>

    );

}

export default ResetPassword;
