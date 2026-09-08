import StatCard from "../components/StatCard";
import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {

   const [summary, setSummary] = useState(null);
    const [role, setRole] = useState("");

    const loadDashboard = async () => {

        try {

            const userRole = localStorage.getItem("role");
            setRole(userRole);

            let endpoint = "/dashboard/summary";

            if (userRole === "TUTOR") {
                endpoint = "/dashboard/tutor";
            }

            const response = await api.get(endpoint);

            setSummary(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };  


    useEffect(() => {

        loadDashboard();

        const interval = setInterval(loadDashboard, 5000);

        return () => clearInterval(interval);

    }, []);

    return (

        <>

            <h2>Dashboard</h2>

            <div className="cards">

                {role !== "TUTOR" && (
                    <StatCard
                        title="Sessions"
                        value={summary?.total_sessions ?? 0}
                    />
                )}

                <StatCard title="Running" value={summary?.running_sessions ?? 0} />

                <StatCard title="Present" value={summary?.present_students ?? 0} />

                <StatCard title="Checked Out" value={summary?.checked_out_students ?? 0} />

            </div>

            <div className="dashboard-grid">

                <div className="panel">

                    <h3>Current Session</h3>

                    <hr />

                    <p><b>Course:</b> {summary?.current_session?.course ?? "-"}</p>

                    {role !== "TUTOR" && (
                        <p><b>Lecturer:</b> {summary?.current_session?.lecturer ?? "-"}</p>
                    )}

                    <p><b>Room:</b> {summary?.current_session?.room ?? "-"}</p>
                    <p><b>Camera:</b> {summary?.current_session?.device_id ?? "-"}</p>
                    <p><b>Status:</b> {summary?.current_session?.status ?? "No Active Session"}</p>

                </div>

                {role !== "TUTOR" && (

<div className="panel">

    <h3>System Status</h3>

    <hr />

    <p>🟢 Backend</p>

    <p>🟢 Recognition Terminal</p>

    <p>🟢 Database</p>

</div>

)}

            </div>

        </>

    );

}

export default Dashboard;