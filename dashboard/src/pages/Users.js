import { useEffect, useState } from "react";
import api from "../services/api";

function Users() {


    const [editingUser, setEditingUser] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        full_name: "",
        email: "",
        role: "TUTOR"
    });

    const [users, setUsers] = useState([]);

    useEffect(() => {

        loadUsers();

    }, []);

    const createUser = async () => {

        try {

            await api.post("/users", newUser);

            setShowForm(false);

            setNewUser({
                username: "",
                password: "",
                full_name: "",
                email: "",
                role: "TUTOR"
            });

            loadUsers();

        } catch (error) {

            alert(error.response?.data?.detail || "Unable to create user");

        }

    };

    const loadUsers = async () => {

        try {

            const response = await api.get("/users");

            setUsers(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    const updateUser = async () => {

        try {

            await api.put(
                `/users/${editingUser.id}`,
                editingUser
            );

            setEditingUser(null);

            loadUsers();

        } catch (error) {

            alert(error.response?.data?.detail || "Update failed");

        }

    };

    return (

        <div style={{ padding: "30px" }}>

            <h2 style={{ marginBottom: "25px" }}>
                User Management
            </h2>

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
            >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px"
                }}
            >

                <h2>User Management</h2>

                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        background: "#2E7D32",
                        color: "white",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    + Add User
                </button>

            </div>

            {showForm && (

            <div
                style={{
                    background: "#F8F9FA",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "25px"
                }}
            >

                <h3>Create Tutor</h3>

                <input
                    placeholder="Full Name"
                    value={newUser.full_name}
                    onChange={(e)=>
                        setNewUser({
                            ...newUser,
                            full_name:e.target.value
                        })
                    }
                />

                <input
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e)=>
                        setNewUser({
                            ...newUser,
                            username:e.target.value
                        })
                    }
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e)=>
                        setNewUser({
                            ...newUser,
                            email:e.target.value
                        })
                    }
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e)=>
                        setNewUser({
                            ...newUser,
                            password:e.target.value
                        })
                    }
                />

                <button onClick={createUser}>
                    Create User
                </button>
                    
            </div>

            )}

            {editingUser && (

                    <div
                        style={{
                            background: "#F8F9FA",
                            padding: "20px",
                            borderRadius: "10px",
                            marginBottom: "25px"
                        }}
                    >

                    <h3>Edit User</h3>

                    <label>Username</label>

                    <input
                        value={editingUser.username}
                        disabled
                    />

                    <label>Full Name</label>

                    <input
                        value={editingUser.full_name}
                        onChange={(e)=>
                            setEditingUser({
                                ...editingUser,
                                full_name:e.target.value
                            })
                        }
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        value={editingUser.email || ""}
                        onChange={(e)=>
                            setEditingUser({
                                ...editingUser,
                                email:e.target.value
                            })
                        }
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={editingUser.password}
                        onChange={(e)=>
                            setEditingUser({
                                ...editingUser,
                                password:e.target.value
                            })
                        }
                    />

                    <label>Role</label>

                    <select
                        value={editingUser.role}
                        onChange={(e)=>
                            setEditingUser({
                                ...editingUser,
                                role:e.target.value
                            })
                        }
                    >

                    <option value="ADMIN">ADMIN</option>

                    <option value="TUTOR">TUTOR</option>

                    </select>

                    <br /><br />

                    <button onClick={updateUser}>
                        Save Changes
                    </button>

                    <button
                        onClick={() => setEditingUser(null)}
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

                            <th style={{ padding: "15px" }}>Username</th>

                            <th>Full Name</th>

                            <th>Email</th>

                            <th>Role</th>

                            <th>Status</th>

                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {users.map((user) => (

                            <tr
                                key={user.id}
                                style={{
                                    borderBottom: "1px solid #ddd"
                                }}
                            >

                                <td style={{ padding: "15px" }}>
                                    {user.username}
                                </td>

                                <td>
                                    {user.full_name}
                                </td>

                                <td>
                                    {user.email || "—"}
                                </td>

                                <td>

                                    <span
                                        style={{
                                            background:
                                                user.role === "ADMIN"
                                                    ? "#1565C0"
                                                    : "#2E7D32",

                                            color: "white",

                                            padding: "6px 12px",

                                            borderRadius: "20px",

                                            fontSize: "14px"
                                        }}
                                    >
                                        {user.role}
                                    </span>

                                </td>

                                <td>

                                    <span
                                        style={{
                                            background:
                                                user.active
                                                    ? "#2E7D32"
                                                    : "#D32F2F",

                                            color: "white",

                                            padding: "6px 12px",

                                            borderRadius: "20px",

                                            fontSize: "14px"
                                        }}
                                    >
                                        {user.active ? "ACTIVE" : "DISABLED"}
                                    </span>

                                </td>

                                <td>

                                    <button
                                        onClick={() => setEditingUser({
                                            ...user,
                                            password: ""
                                        })}
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

export default Users;