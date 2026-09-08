import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";


function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotSubmitting, setForgotSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (token) {
            navigate("/");
        }

    }, [navigate]);

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const response = await api.post("/auth/login", {
                username,
                password
            });

            localStorage.setItem(
                "token",
                response.data.access_token
            );

            localStorage.setItem(
                "username",
                response.data.username
            );

            localStorage.setItem(
                "role",
                response.data.role
            );

            localStorage.setItem(
                "full_name",
                response.data.full_name
            );

            navigate("/");

        } catch (error) {

            alert("Invalid username or password");

        }

    };

    const handleForgotPassword = async (e) => {

        e.preventDefault();

        setForgotSubmitting(true);
        setForgotMessage("");

        try {

            const response = await api.post("/auth/forgot-password", {
                email: forgotEmail
            });

            setForgotMessage(
                response.data.message ||
                "If that email is registered, a password reset link has been sent."
            );

        } catch (error) {

            setForgotMessage(
                error.response?.data?.detail ||
                "Unable to send reset email right now. Please try again later."
            );

        } finally {

            setForgotSubmitting(false);

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

                    {!showForgotPassword ? (

                    <>

                    <h2 className="login-form-heading">
                        Welcome back
                    </h2>

                    <p className="login-form-subheading">
                        Sign in to continue to your dashboard
                    </p>

                    <form onSubmit={handleLogin}>

                        <label className="login-label">
                            Username
                        </label>

                        <input
                            type="text"
                            className="login-input"
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)}
                        />

                        <label className="login-label">
                            Password
                        </label>

                        <input
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                        />

                        <button
                            type="submit"
                            className="login-submit-btn"
                        >
                            Login
                        </button>

                    </form>

                    <p style={{ marginTop: "16px", textAlign: "center" }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(true);
                                setForgotEmail("");
                                setForgotMessage("");
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#2E7D32",
                                cursor: "pointer",
                                textDecoration: "underline",
                                fontSize: "14px"
                            }}
                        >
                            Forgot password?
                        </button>
                    </p>

                    </>

                    ) : (

                    <>

                    <h2 className="login-form-heading">
                        Reset your password
                    </h2>

                    <p className="login-form-subheading">
                        Enter your email and we'll send you a link to reset
                        your password.
                    </p>

                    <form onSubmit={handleForgotPassword}>

                        <label className="login-label">
                            Email
                        </label>

                        <input
                            type="email"
                            className="login-input"
                            value={forgotEmail}
                            required
                            onChange={(e)=>setForgotEmail(e.target.value)}
                        />

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={forgotSubmitting}
                        >
                            {forgotSubmitting ? "Sending..." : "Send reset link"}
                        </button>

                    </form>

                    {forgotMessage && (
                        <p style={{ marginTop: "16px", textAlign: "center" }}>
                            {forgotMessage}
                        </p>
                    )}

                    <p style={{ marginTop: "16px", textAlign: "center" }}>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#2E7D32",
                                cursor: "pointer",
                                textDecoration: "underline",
                                fontSize: "14px"
                            }}
                        >
                            Back to login
                        </button>
                    </p>

                    </>

                    )}

                </div>

            </div>

        </div>

    );

}

export default Login;