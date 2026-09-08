import axios from "axios";

// Use whatever host/IP the dashboard was loaded from so this keeps working
// no matter which network or address the server is reachable on.
const api = axios.create({
    baseURL: `http://${window.location.hostname}:8000`
});

// Automatically attach JWT token to every request
api.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => Promise.reject(error)
);

// Force re-login when the token is missing/expired/invalid
api.interceptors.response.use(
    (response) => response,

    (error) => {

        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            localStorage.removeItem("full_name");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;