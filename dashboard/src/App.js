import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Users from "./pages/Users";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import Courses from "./pages/Courses";
import Enrollments from "./pages/Enrollments";
import TutorAssignments from "./pages/TutorAssignments";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function DashboardLayout() {
  return (
    <div className="app">
      <Sidebar />

      <div className="content">
        <Header />

        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />

          <Route path="/sessions" element={<Sessions />} />

          <Route path="/attendance" element={<Attendance />} />

          <Route path="/reports" element={<Reports />} />

          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <Users />
                </ProtectedRoute>
            }
        />
          <Route
            path="/courses"
            element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <Courses />
                </ProtectedRoute>
            }
        />
          <Route
            path="/enrollments"
            element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <Enrollments />
                </ProtectedRoute>
            }
        />

          <Route
            path="/tutor-assignments"
            element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <TutorAssignments />
                </ProtectedRoute>
            }
        />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;