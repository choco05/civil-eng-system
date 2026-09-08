import { useEffect, useState } from "react";
import api from "../services/api";

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse"
};

const headerCell = {
    padding: "14px",
    background: "#2E7D32",
    color: "white",
    textAlign: "left",
    fontWeight: "600"
};

const cell = {
    padding: "14px",
    borderBottom: "1px solid #E5E7EB"
};

const getStatusBadge = (status) => {

    const colors = {
        ACTIVE: "#2E7D32",
        CHECKED_OUT: "#757575",
        RUNNING: "#2E7D32",
        SCHEDULED: "#F9A825",
        FINISHED: "#C62828"
    };

    return (
        <span
            style={{
                background: colors[status] || "#607D8B",
                color: "white",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                display: "inline-block",
                minWidth: "120px",
                textAlign: "center"
            }}
        >
            {status.replace("_", " ")}
        </span>
    );

};

const formatDateTime = (dateTime) => {

    if (!dateTime) return "-";

    const date = new Date(dateTime);

    return date.toLocaleString("en-NZ", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

};

function Attendance() {
    const role = localStorage.getItem("role");
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState(null);

    const loadAttendance = async () => {

        try {

            const endpoint =
                role === "TUTOR"
                    ? "/attendance/live"
                    : "/attendance/";

            const response = await api.get(endpoint);

            setAttendance(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const loadSummary = async () => {

        try {

            const response = await api.get("/dashboard/summary");

            setSummary(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    useEffect(() => {

        loadAttendance();

        loadSummary();

        const interval = setInterval(() => {

            loadAttendance();

            loadSummary();

        }, 5000);

        return () => clearInterval(interval);

    }, []);

    return (

        <div style={{ padding: "30px" }}>

            <h2 style={{ marginBottom: "25px" }}>
            Attendance
            </h2>

            <div
            style={{
            background:"white",
            padding:"25px",
            borderRadius:"12px",
            marginBottom:"25px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.1)"
            }}
            >

            <h3>Current Session</h3>

            <hr/>

            <p><b>Course:</b> {summary?.current_session?.course ?? "-"}</p>

            <p><b>Lecturer:</b> {summary?.current_session?.lecturer ?? "-"}</p>

            <p><b>Room:</b> {summary?.current_session?.room ?? "-"}</p>

            <p><b>Camera:</b> {summary?.current_session?.device_id ?? "-"}</p>

            <p><b>Status:</b> {summary?.current_session?.status ?? "No Active Session"}</p>

</div>

<div
    style={{
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}
>

    <h3>
        {role === "TUTOR"
            ? "Live Attendance — Current Session"
            : "Attendance Records"}
    </h3>

    <table
        className="attendance-table"
        style={tableStyle}
    >
        <thead>

            <tr>

            <th style={headerCell}>Student ID</th>
            <th style={headerCell}>Time In</th>
            <th style={headerCell}>Last Seen</th>
            <th style={headerCell}>Time Out</th>
            <th style={headerCell}>Status</th>

            </tr>

            </thead>

        <tbody>

            {attendance.map((record) => (

                <tr
                    key={record.id}
                    style={{
                        background:
                            record.id % 2 === 0
                                ? "#FAFAFA"
                                : "#FFFFFF"
                    }}
                >

                    <td style={cell}>{record.student_id}</td>

                    <td style={cell}>
                        {formatDateTime(record.time_in)}
                    </td>

                    <td style={cell}>
                        {formatDateTime(record.last_seen)}
                    </td>

                    <td style={cell}>
                        {formatDateTime(record.time_out)}
                    </td>

                    <td style={cell}>
                        {getStatusBadge(record.status)}
                    </td>

                </tr>

            ))}

            {attendance.length === 0 && (
                <tr>
                    <td style={cell} colSpan={5}>
                        {role === "TUTOR"
                            ? "No students are currently attending a session."
                            : "No attendance records."}
                    </td>
                </tr>
            )}

        </tbody>

    </table>

</div>

</div>

);

}

export default Attendance;