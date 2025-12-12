import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Banner from "./components/Banner";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

import AdminHome from "./pages/Admin/AdminHome";
import CompanyEdit from "./pages/Admin/CompanyEdit";
import People from "./pages/Admin/People";
import AssignTeam from "./pages/Admin/AssignTeam";

import ManagerHome from "./pages/Manager/ManagerHome";
import TaskBoard from "./pages/Manager/TaskBoard";
import AddTask from "./pages/Manager/AddTask";
import CompletedTasks from "./pages/Manager/CompletedTasks";

import EmployeeHome from "./pages/Employee/EmployeeHome";
import MyBoard from "./pages/Employee/MyBoard";
import ColleagueBoard from "./pages/Employee/ColleagueBoard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Banner />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requiredRoles={["ADMIN"]}><AdminHome /></ProtectedRoute>} />
          <Route path="/admin/company" element={<ProtectedRoute requiredRoles={["ADMIN"]}><CompanyEdit /></ProtectedRoute>} />
          <Route path="/admin/people" element={<ProtectedRoute requiredRoles={["ADMIN"]}><People /></ProtectedRoute>} />
          <Route path="/admin/assign" element={<ProtectedRoute requiredRoles={["ADMIN"]}><AssignTeam /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/manager" element={<ProtectedRoute requiredRoles={["MANAGER"]}><ManagerHome /></ProtectedRoute>} />
          <Route path="/manager/board" element={<ProtectedRoute requiredRoles={["MANAGER"]}><TaskBoard /></ProtectedRoute>} />
          <Route path="/manager/add-task" element={<ProtectedRoute requiredRoles={["MANAGER"]}><AddTask /></ProtectedRoute>} />
          <Route path="/manager/completed" element={<ProtectedRoute requiredRoles={["MANAGER"]}><CompletedTasks /></ProtectedRoute>} />

          {/* Employee */}
          <Route path="/employee" element={<ProtectedRoute requiredRoles={["EMPLOYEE"]}><EmployeeHome /></ProtectedRoute>} />
          <Route path="/employee/myboard" element={<ProtectedRoute requiredRoles={["EMPLOYEE"]}><MyBoard /></ProtectedRoute>} />
          <Route path="/employee/colleagues" element={<ProtectedRoute requiredRoles={["EMPLOYEE"]}><ColleagueBoard /></ProtectedRoute>} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
