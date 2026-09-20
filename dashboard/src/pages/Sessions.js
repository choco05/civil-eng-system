import { useEffect, useState } from "react";
import api from "../services/api";

const DEFAULT_CAMERA_ID = "CAMERA-01";

function Sessions() {

    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const role = localStorage.getItem("role");
    const [form, setForm] = useState({
        course_id: "",
        room: "",
        device_id: DEFAULT_CAMERA_ID,
        scheduled_start: "",
        scheduled_end: "",
        verification_interval: 30
    });
    const loadSessions = () => {
        const endpoint =
            role === "ADMIN"
                ? "/sessions"
                : "/sessions/my";

        api.get(endpoint)
            .then((response) => {
                setSessions(response.data);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const loadCourses = async () => {
        try {
            const response = await api.get("/courses/my");
            setCourses(response.data);
        } catch (error) {
            console.error("Failed to load courses", error);
        }
    };

    useEffect(() => {
        loadSessions();
        loadCourses();

        const interval = setInterval(loadSessions, 5000);

        return () => clearInterval(interval);

    }, []);

    const startSession = async (id) => {

        try {

            await api.put(`/sessions/${id}/start`);

            loadSessions();

        }

        catch (error) {

            console.error(error);

        }

    };

    const finishSession = async (id) => {

        try {

            await api.put(`/sessions/${id}/finish`);

            loadSessions();

        }

        catch (error) {

            console.error(error);

        }

    };




    const createSession = async () => {

    try {

        // Only admins can choose a camera; tutors always use the default
        const deviceId =
            role === "ADMIN"
                ? form.device_id.trim() || DEFAULT_CAMERA_ID
                : DEFAULT_CAMERA_ID;

        await api.post("/sessions/", {
            ...form,
            device_id: deviceId
        });

        loadSessions();

        setForm({
            course_id: "",
            room: "",
            device_id: DEFAULT_CAMERA_ID,
            scheduled_start: "",
            scheduled_end: "",
            verification_interval: 30
        });

    }

    catch (error) {

        console.error(error);

    }

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

    return (
        <div>

            <h2>Sessions</h2>

            <div
                style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    marginBottom: "25px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
            >

            <h3>Create New Session</h3>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px"
                }}
            >

            <div>
            <label>Course</label>

            <select
            value={form.course_id}
            onChange={(e)=>
            setForm({
            ...form,
            course_id:Number(e.target.value)
            })
            }
            style={{width:"100%"}}
            >

            <option value="">Select Course</option>

            {courses.map(course=>(

            <option
            key={course.id}
            value={course.id}
            >

            {course.course_code} - {course.course_name}

            </option>

            ))}

            </select>
            </div>

            

            <div>
            <label>Room</label><br/>
            <input
            value={form.room}
            onChange={(e)=>setForm({...form,room:e.target.value})}
            style={{width:"100%"}}
            />
            </div>

            {role === "ADMIN" && (
            <div>
            <label>Camera</label><br/>
            <input
            value={form.device_id}
            onChange={(e)=>setForm({...form,device_id:e.target.value})}
            style={{width:"100%"}}
            />
            </div>
            )}

            <div>
            <label>Scheduled Start</label><br/>
            <input
            type="datetime-local"
            value={form.scheduled_start}
            onChange={(e)=>
            setForm({
            ...form,
            scheduled_start:e.target.value
            })
            }
            style={{width:"100%"}}
            />
            </div>

            <div>
            <label>Scheduled End</label><br/>
            <input
            type="datetime-local"
            value={form.scheduled_end}
            onChange={(e)=>
            setForm({
            ...form,
            scheduled_end:e.target.value
            })
            }
            style={{width:"100%"}}
            />
            </div>

            </div>

            <br/>

            <button
            onClick={createSession}
            style={{
            padding:"10px 20px",
            background:"#2f64e1",
            color:"white",
            border:"none",
	    borderRadius:"6px",
            cursor:"pointer"
            }}
            >
            Create Session
            </button>

            </div>
                        

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white"
                }}
            >

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Course</th>
                        <th>Lecturer</th>
                        <th>Room</th>
                        <th>Camera</th>
                        <th>Status</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {sessions.map((session) => (

                        <tr key={session.id}>

                            <td>{session.id}</td>
                            <td>
                                {courses.find(c => c.id === session.course_id)?.course_code}
                            </td>

                            <td>
                                {courses.find(c => c.id === session.course_id)?.course_name}
                            </td>
                            <td>{session.room}</td>
                            <td>{session.device_id}</td>
                            <td>
                        {getStatusBadge(session.status)}
                    </td>

                            <td>

                                <button
                                    disabled={session.status !== "SCHEDULED"}
                                    onClick={() => startSession(session.id)}
                                    style={{
                                        padding: "6px 12px",
                                        cursor: session.status === "SCHEDULED" ? "pointer" : "not-allowed"
                                    }}
                                >
                                    Start
                                </button>

                                <button
                                    disabled={session.status !== "RUNNING"}
                                    onClick={() => finishSession(session.id)}
                                    style={{
                                        marginLeft: "10px",
                                        padding: "6px 12px",
                                        cursor: session.status === "RUNNING" ? "pointer" : "not-allowed"
                                    }}
                                >
                                    Finish
                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );

}

export default Sessions;
