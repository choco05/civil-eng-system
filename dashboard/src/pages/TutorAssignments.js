import { useEffect, useState } from "react";
import api from "../services/api";

function TutorAssignments() {

    const [tutors, setTutors] = useState([]);
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [selectedTutor, setSelectedTutor] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");

    useEffect(() => {
        loadTutors();
        loadCourses();
        loadAssignments();
    }, []);

    const loadTutors = async () => {
        const res = await api.get("/users");

        setTutors(
            res.data.filter(user => user.role === "TUTOR")
        );
    };

    const loadCourses = async () => {
        const res = await api.get("/courses");

        setCourses(
            res.data.filter(course => course.active)
        );
    };

    const loadAssignments = async () => {
        const res = await api.get("/tutor-courses");

        setAssignments(res.data);
    };

    const assignTutor = async () => {

        try {

            await api.post("/tutor-courses", {

                user_id: Number(selectedTutor),

                course_id: Number(selectedCourse)

            });

            setSelectedTutor("");
            setSelectedCourse("");

            loadAssignments();

        } catch (error) {

            alert(error.response?.data?.detail);

        }

    };

    const removeAssignment = async (id) => {

        try {

            await api.delete(`/tutor-courses/${id}`);

            loadAssignments();

        } catch (error) {

            alert(
                error.response?.data?.detail ||
                "Unable to remove assignment"
            );

        }

    };

    return (

        <div style={{ padding: "30px" }}>

            <h2>Tutor Course Assignment</h2>

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    marginBottom: "25px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
            >

                <h3>Assign Tutor to Course</h3>

                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                        alignItems: "center",
                        marginTop: "20px"
                    }}
                >

                    <select
                        value={selectedTutor}
                        onChange={(e) =>
                            setSelectedTutor(e.target.value)
                        }
                    >

                        <option value="">
                            Select Tutor
                        </option>

                        {tutors.map(tutor => (

                            <option
                                key={tutor.id}
                                value={tutor.id}
                            >
                                {tutor.full_name}
                            </option>

                        ))}

                    </select>

                    <select
                        value={selectedCourse}
                        onChange={(e) =>
                            setSelectedCourse(e.target.value)
                        }
                    >

                        <option value="">
                            Select Course
                        </option>

                        {courses.map(course => (

                            <option
                                key={course.id}
                                value={course.id}
                            >
                                {course.course_code} - {course.course_name}
                            </option>

                        ))}

                    </select>

                    <button
                        onClick={assignTutor}
                        style={{
                            background: "#2E7D32",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        Assign
                    </button>

                </div>

            </div>

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
            >

                <h3>Current Tutor Assignments</h3>

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginTop: "20px"
                    }}
                >

                    <thead
                        style={{
                            background: "#2E7D32",
                            color: "white"
                        }}
                    >

                        <tr>

                            <th style={{ padding: "15px" }}>
                                Tutor
                            </th>

                            <th>
                                Course
                            </th>

                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {assignments.map((assignment) => {

                            const tutor = tutors.find(
                                t => t.id === assignment.user_id
                            );

                            const course = courses.find(
                                c => c.id === assignment.course_id
                            );

                            return (

                                <tr
                                    key={assignment.id}
                                    style={{
                                        borderBottom:
                                            "1px solid #ddd"
                                    }}
                                >

                                    <td style={{ padding: "15px" }}>
                                        {tutor
                                            ? tutor.full_name
                                            : assignment.user_id}
                                    </td>

                                    <td>
                                        {course
                                            ? `${course.course_code} - ${course.course_name}`
                                            : assignment.course_id}
                                    </td>

                                    <td>

                                        <button
                                            onClick={() =>
                                                removeAssignment(
                                                    assignment.id
                                                )
                                            }
                                        >
                                            Remove
                                        </button>

                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default TutorAssignments;