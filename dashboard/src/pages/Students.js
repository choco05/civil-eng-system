import { useEffect, useState } from "react";
import api from "../services/api";

function Students() {

    const [students, setStudents] = useState([]);

    const loadStudents = async () => {

        try {

            const response = await api.get("/students/");

            setStudents(response.data);

            console.log(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    useEffect(() => {

        loadStudents();

        const interval = setInterval(loadStudents, 5000);

        return () => clearInterval(interval);

    }, []);

    return (

        <div style={{ padding: "30px" }}>

            <h2 style={{ marginBottom: "25px" }}>
                Students
            </h2>

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
            >

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background: "#2E7D32",
                                color: "white"
                            }}
                        >

                            <th style={{ padding: "14px" }}>Student ID</th>
                            <th style={{ padding: "14px" }}>Name</th>
                            <th style={{ padding: "14px" }}>Face Registered</th>
                            <th style={{ padding: "14px" }}>Face File</th>

                        </tr>

                    </thead>

                    <tbody>

                        {students.map((student) => (

                            <tr
                                key={student.id}
                                style={{
                                    background:
                                        student.id % 2 === 0
                                            ? "#FAFAFA"
                                            : "white"
                                }}
                            >

                                <td style={{ padding: "14px" }}>
                                    {student.student_id}
                                </td>

                                <td style={{ padding: "14px" }}>
                                    {student.name}
                                </td>

                                <td style={{ padding: "14px" }}>

                                    {student.face_file ?

                                        <span
                                            style={{
                                                background: "#2E7D32",
                                                color: "white",
                                                padding: "6px 12px",
                                                borderRadius: "20px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            REGISTERED
                                        </span>

                                        :

                                        <span
                                            style={{
                                                background: "#C62828",
                                                color: "white",
                                                padding: "6px 12px",
                                                borderRadius: "20px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            NOT REGISTERED
                                        </span>

                                    }

                                </td>

                                <td style={{ padding: "14px" }}>
                                    {student.face_file ?? "-"}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

        );

}

export default Students;