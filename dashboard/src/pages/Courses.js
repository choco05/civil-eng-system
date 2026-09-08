import { useEffect, useState } from "react";
import api from "../services/api";

function Courses() {

    const [courses, setCourses] = useState([]);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [newCourse, setNewCourse] = useState({
        course_code: "",
        course_name: "",
        lecturer: ""
    });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await api.get("/courses");
            setCourses(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const createCourse = async () => {

        try {

            await api.post("/courses", newCourse);

            setShowForm(false);

            setNewCourse({
                course_code: "",
                course_name: "",
                lecturer: ""
            });

            loadCourses();

        } catch (error) {

            alert(error.response?.data?.detail || "Unable to create course");

        }

    };

    const updateCourse = async () => {

        try {

            await api.put(
                `/courses/${editingCourse.id}`,
                editingCourse
            );

            setEditingCourse(null);

            loadCourses();

        } catch (error) {

            alert(error.response?.data?.detail || "Unable to update course");

        }

    };

    const toggleCourseStatus = async (course) => {

        try {

            await api.patch(
                `/courses/${course.id}/status`,
                {
                    active: !course.active
                }
            );

            loadCourses();

        } catch (error) {

            alert(
                error.response?.data?.detail ||
                "Unable to update course status"
            );

        }

    };

    return (
        <div style={{ padding: "30px" }}>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "25px"
                }}
            >

                <h2>Course Management</h2>

                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        background: "#2E7D32",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    + Add Course
                </button>

            </div>

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
            >
            {showForm && (

            <div
                style={{
                    background: "#F8F9FA",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "25px"
                }}
            >

            <h3>Add Course</h3>

            <input
                placeholder="Course Code"
                value={newCourse.course_code}
                onChange={(e)=>
                    setNewCourse({
                        ...newCourse,
                        course_code:e.target.value
                    })
                }
            />

            <input
                placeholder="Course Name"
                value={newCourse.course_name}
                onChange={(e)=>
                    setNewCourse({
                        ...newCourse,
                        course_name:e.target.value
                    })
                }
            />

            <input
                placeholder="Lecturer"
                value={newCourse.lecturer}
                onChange={(e)=>
                    setNewCourse({
                        ...newCourse,
                        lecturer:e.target.value
                    })
                }
            />

            <br /><br />

            <button onClick={createCourse}>
                Create Course
            </button>

            <button
                onClick={() => setShowForm(false)}
                style={{ marginLeft: "10px" }}
            >
                Cancel
            </button>

            </div>

            )}

            {editingCourse && (

            <div
                style={{
                    background: "#F8F9FA",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "25px"
                }}
            >

            <h3>Edit Course</h3>

            <input
                value={editingCourse.course_code}
                disabled
            />

            <input
                value={editingCourse.course_name}
                onChange={(e)=>
                    setEditingCourse({
                        ...editingCourse,
                        course_name:e.target.value
                    })
                }
            />

            <input
                value={editingCourse.lecturer}
                onChange={(e)=>
                    setEditingCourse({
                        ...editingCourse,
                        lecturer:e.target.value
                    })
                }
            />

            <br /><br />

            <button onClick={updateCourse}>
                Save Changes
            </button>

            <button
                onClick={() => setEditingCourse(null)}
                style={{ marginLeft: "10px" }}
            >
                Cancel
            </button>

            </div>

            )}

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse"
                    }}
                >

                    <thead
                        style={{
                            background: "#2E7D32",
                            color: "white"
                        }}
                    >

                        <tr>

                            <th style={{ padding: "15px" }}>Course Code</th>

                            <th>Course Name</th>

                            <th>Lecturer</th>

                            <th>Status</th>

                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {courses.map((course) => (

                            <tr
                                key={course.id}
                                style={{
                                    borderBottom: "1px solid #ddd"
                                }}
                            >

                                <td style={{ padding: "15px" }}>
                                    {course.course_code}
                                </td>

                                <td>{course.course_name}</td>

                                <td>{course.lecturer}</td>

                                <td>

                                    <span
                                        onClick={() => toggleCourseStatus(course)}
                                        style={{
                                            background: course.active
                                                ? "#2E7D32"
                                                : "#D32F2F",

                                            color: "white",

                                            padding: "6px 12px",

                                            borderRadius: "20px"
                                        }}
                                    >
                                        {course.active ? "ACTIVE" : "DISABLED"}
                                    </span>

                                </td>

                                <td>

                                    <button
                                        onClick={() =>
                                            setEditingCourse({
                                                ...course
                                            })
                                        }
                                    >
                                        Edit
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Courses;