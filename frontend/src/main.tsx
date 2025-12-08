import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/company" element={<CompanyEdit />} />
        <Route path="/admin/people" element={<People />} />
        <Route path="/admin/assign" element={<AssignTeam />} />

        {/* Manager */}
        <Route path="/manager" element={<ManagerHome />} />
        <Route path="/manager/board" element={<TaskBoard />} />
        <Route path="/manager/add-task" element={<AddTask />} />
        <Route path="/manager/completed" element={<CompletedTasks />} />

        {/* Employee */}
        <Route path="/employee" element={<EmployeeHome />} />
        <Route path="/employee/myboard" element={<MyBoard />} />
        <Route path="/employee/colleagues" element={<ColleagueBoard />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
