import { useEffect, useState } from "react";
import api from "../services/api";

function Enrollments() {

    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);

    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");

    useEffect(() => {
        loadStudents();
        loadCourses();
        loadEnrollments();
    }, []);

    const loadStudents = async () => {
        const res = await api.get("/students");
        setStudents(res.data);
    };

    const loadCourses = async () => {
        const res = await api.get("/courses");
        setCourses(res.data.filter(c => c.active));
    };

    const loadEnrollments = async () => {
        const res = await api.get("/student-courses");
        setEnrollments(res.data);
    };

    const assignCourse = async () => {

        try {

            await api.post("/student-courses", {

                student_id: Number(selectedStudent),

                course_id: Number(selectedCourse)

            });

            setSelectedStudent("");
            setSelectedCourse("");

            loadEnrollments();

        } catch (error) {

            alert(error.response?.data?.detail);

        }

    };

    const removeEnrollment = async (id) => {

        try {

            await api.delete(`/student-courses/${id}`);

            loadEnrollments();

        } catch (error) {

            alert(
                error.response?.data?.detail ||
                "Unable to remove enrollment"
            );

        }

    };

    return (
        <div style={{ padding: "30px" }}>
            <h2>Enrollment Management</h2>

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    marginBottom: "25px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
            >

                <h3>Assign Student to Course</h3>

                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                        alignItems: "center",
                        marginTop: "20px"
                    }}
                >

                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                        <option value="">Select Student</option>

                        {students.map(student => (
                            <option
                                key={student.id}
                                value={student.id}
                            >
                                {student.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                        <option value="">Select Course</option>

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
                        onClick={assignCourse}
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

                <h3>Current Enrollments</h3>

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

                            <th style={{ padding: "15px" }}>Student</th>

                            <th>Course</th>

                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {enrollments.map((enrollment) => {

                            const student = students.find(
                                s => s.id === enrollment.student_id
                            );

                            const course = courses.find(
                                c => c.id === enrollment.course_id
                            );

                            return (

                                <tr
                                    key={enrollment.id}
                                    style={{
                                        borderBottom: "1px solid #ddd"
                                    }}
                                >

                                    <td style={{ padding: "15px" }}>
                                        {student ? student.name : enrollment.student_id}
                                    </td>

                                    <td>
                                        {course
                                            ? `${course.course_code} - ${course.course_name}`
                                            : enrollment.course_id}
                                    </td>

                                    <td>

                                        <button
                                            onClick={() =>
                                                removeEnrollment(enrollment.id)
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

export default Enrollments;