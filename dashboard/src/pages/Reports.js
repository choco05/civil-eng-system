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
                fontWeight: "600",
                fontSize: "13px"
            }}
        >
            {status.replace("_", " ")}
        </span>

    );

};

const formatDate = (value) => {

    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-NZ", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

};

function Reports() {

    const [reports, setReports] = useState([]);
    const role = localStorage.getItem("role");
    const totalRecords = reports.length;

    const sessions = Object.values(
        reports.reduce((bySession, report) => {

            if (!bySession[report.session_id]) {
                bySession[report.session_id] = {
                    session_id: report.session_id,
                    course_code: report.course_code,
                    session_date: report.session_date,
                    session_status: report.session_status
                };
            }

            return bySession;

        }, {})
    ).sort((a, b) => b.session_id - a.session_id);

    const activeStudents = reports.filter(
        report => report.status === "ACTIVE"
    ).length;

    const checkedOutStudents = reports.filter(
        report => report.status === "CHECKED_OUT"
    ).length;


        const loadReports = async () => {

        try {

            const endpoint =
                role === "ADMIN"
                    ? "/reports"
                    : "/reports/my";

            const response = await api.get(endpoint);

            setReports(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const downloadReport = async (sessionId) => {
    try {
        const response = await api.get(
            `/reports/download/${sessionId}`,
            {
                responseType: "blob",
            }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
            "download",
            `Attendance_Report_Session_${sessionId}.csv`
        );

        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        console.error(error);

        let message = "Failed to download report.";

        if (error.response?.data instanceof Blob) {
            try {
                const text = await error.response.data.text();
                message = JSON.parse(text).detail || message;
            } catch {
                // response wasn't JSON, fall back to default message
            }
        }

        alert(message);
    }
};

    const downloadBulkReport = async (period) => {

        try {

            const response = await api.get(
                `/reports/download/${period}`,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `Attendance_Report_${period}.csv`
            );

            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {

            let message = `Failed to download ${period} report.`;

            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    message = JSON.parse(text).detail || message;
                } catch {
                    // response wasn't JSON, fall back to default message
                }
            }

            alert(message);
        }

    };

    useEffect(() => {

        loadReports();

        const interval = setInterval(loadReports, 5000);

        return () => clearInterval(interval);

    }, []);

    return (

        <div style={{ padding: "30px" }}>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "25px",
                    flexWrap: "wrap",
                    gap: "12px"
                }}
            >

                <h2 style={{ margin: 0 }}>
                    Reports
                </h2>

                <div style={{ display: "flex", gap: "12px" }}>

                    <button
                        onClick={() => downloadBulkReport("weekly")}
                        style={{
                            background: "#0E6E80",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 18px",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        Download Weekly Report
                    </button>

                    <button
                        onClick={() => downloadBulkReport("fortnightly")}
                        style={{
                            background: "#0B4A57",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 18px",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        Download Fortnightly Report
                    </button>

                </div>

            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "20px",
                    marginBottom: "30px"
                }}
            >

                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "25px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                >
                    <h3>Total Records</h3>

                    <h1 style={{ color: "#2E7D32" }}>
                        {totalRecords}
                    </h1>

                </div>

                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "25px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                >
                    <h3>Active</h3>

                    <h1 style={{ color: "#2E7D32" }}>
                        {activeStudents}
                    </h1>

                </div>

                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "25px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                >
                    <h3>Checked Out</h3>

                    <h1 style={{ color: "#2E7D32" }}>
                        {checkedOutStudents}
                    </h1>

                </div>

            </div>

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    marginBottom: "30px"
                }}
            >

                <h3 style={{ marginTop: 0, marginBottom: "18px" }}>
                    Session Reports
                </h3>

                <table style={tableStyle}>

                    <thead>

                        <tr>
                            <th style={headerCell}>Session</th>
                            <th style={headerCell}>Course</th>
                            <th style={headerCell}>Date</th>
                            <th style={headerCell}>Status</th>
                            <th style={headerCell}>Report</th>
                        </tr>

                    </thead>

                    <tbody>

                        {sessions.map((session) => (

                            <tr
                                key={session.session_id}
                                style={{
                                    background:
                                        session.session_id % 2 === 0
                                            ? "#FAFAFA"
                                            : "#FFFFFF"
                                }}
                            >

                                <td style={cell}>#{session.session_id}</td>

                                <td style={cell}>
                                    {session.course_code || "-"}
                                </td>

                                <td style={cell}>
                                    {formatDate(session.session_date)}
                                </td>

                                <td style={cell}>
                                    {getStatusBadge(session.session_status)}
                                </td>

                                <td style={cell}>
                                    {session.session_status === "FINISHED" ? (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => downloadReport(session.session_id)}
                                        >
                                            Download
                                        </button>
                                    ) : (
                                        <span
                                            title="Report available once the session is finished"
                                            style={{ color: "#9E9E9E", fontSize: "13px" }}
                                        >
                                            Session not finished
                                        </span>
                                    )}
                                </td>

                            </tr>

                        ))}

                        {sessions.length === 0 && (
                            <tr>
                                <td style={cell} colSpan={5}>
                                    No sessions yet.
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default Reports;