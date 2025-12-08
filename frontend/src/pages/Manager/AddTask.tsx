import React, { useEffect, useState } from "react";
import api from "../../api/api";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AddTask() {
  const [managerId, setManagerId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [taskList, setTaskList] = useState([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editEmployees, setEditEmployees] = useState<number[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const toast = useToast();

  // Fetch employees under this manager
  const loadEmployees = async (id: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/manager/${id}/employees`);
      setEmployees(res.data);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tasks created by this manager
  const loadTasks = async (id: number) => {
    try {
      const res = await api.get(`/manager/${id}/tasks`);
      setTaskList(res.data);
    } catch (err) {
      toast.error("Failed to load tasks");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const id = res.data.user.id;
        setManagerId(id);
        await loadEmployees(id);
        await loadTasks(id);
      } catch (e) {
        toast.error("Failed to load your profile");
      }
    })();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setPriority("MEDIUM");
    setSelectedEmployees([]);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Task title is required";
    } else if (title.length < 3) {
      newErrors.title = "Task title must be at least 3 characters";
    } else if (title.length > 100) {
      newErrors.title = "Task title must not exceed 100 characters";
    }

    if (desc && desc.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    if (selectedEmployees.length === 0) {
      newErrors.employees = "Please assign at least one employee";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createTask = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      setLoading(true);

      await api.post("/tasks", {
        title: title.trim(),
        description: desc.trim(),
        priority,
        assignedEmployeeIds: selectedEmployees,
      });

      toast.success("Task created successfully!");
      resetForm();
      if (managerId) await loadTasks(managerId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      setLoading(true);
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted successfully!");
      if (managerId) await loadTasks(managerId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (task: any) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
    setEditEmployees(task.assignments?.map((a: any) => a.employeeId) || []);
    setShowEditModal(true);
  };

  const updateTask = async () => {
    if (!editTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      setLoading(true);
      await api.put(`/tasks/${editingTaskId}`, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        assignedEmployeeIds: editEmployees,
      });

      toast.success("Task updated successfully!");
      setShowEditModal(false);
      if (managerId) await loadTasks(managerId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by date
  const groupedTasks = taskList.reduce((acc: Record<string, any[]>, task: any) => {
    const taskDate = new Date(task.createdAt).toISOString().split("T")[0];
    if (!acc[taskDate]) acc[taskDate] = [];
    acc[taskDate].push(task);
    return acc;
  }, {});

  // Get tasks for selected date
  const tasksForSelectedDate = groupedTasks[selectedDate] || [];

  // Get all unique dates sorted in descending order
  const allDates = Object.keys(groupedTasks).sort().reverse();

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Processing..." />}

      <Header role="MANAGER" title="Create New Task" showBack={true} />

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Form Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={`input w-full ${
                    errors.title ? "border-red-400 focus:border-red-500" : ""
                  }`}
                  placeholder="Enter a clear task title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors({ ...errors, title: "" });
                  }}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  {title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  className={`input w-full resize-none ${
                    errors.description ? "border-red-400 focus:border-red-500" : ""
                  }`}
                  placeholder="Add task details, requirements, or instructions (optional)"
                  value={desc}
                  onChange={(e) => {
                    setDesc(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: "" });
                  }}
                  maxLength={500}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  {desc.length}/500 characters
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Priority
                </label>
                <select
                  className="input w-full"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                </select>
              </div>

              {/* Assign Employees */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Assign Employees <span className="text-red-500">*</span>
                </label>

                {employees.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm border border-dashed border-slate-300 rounded-lg">
                    No employees available. Please add employees first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {employees.map((emp: any) => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setSelectedEmployees((prev) =>
                            prev.includes(emp.id)
                              ? prev.filter((id) => id !== emp.id)
                              : [...prev, emp.id]
                          );
                          if (errors.employees) setErrors({ ...errors, employees: "" });
                        }}
                        className={`p-3 border rounded-lg cursor-pointer text-sm transition flex items-center gap-2
                        ${
                          selectedEmployees.includes(emp.id)
                            ? "border-indigo-600 bg-indigo-50 shadow-sm"
                            : "border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={() => {}}
                          className="cursor-pointer"
                        />
                        {emp.profileImage ? (
                          <img
                            src={
                              emp.profileImage.startsWith("http")
                                ? emp.profileImage
                                : `${API_BASE}${emp.profileImage}`
                            }
                            alt={emp.name}
                            className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                            {emp.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate">{emp.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {errors.employees && (
                  <p className="text-xs text-red-500 mt-2">{errors.employees}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-2">
                  {selectedEmployees.length} employee(s) selected
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 btn-primary"
                  onClick={createTask}
                  disabled={loading}
                >
                  Create Task
                </button>
                <button
                  className="btn-secondary px-6"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Tasks List with Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Tasks ({taskList.length})
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input w-40"
              />
            </div>

            {/* Date Info */}
            <div className="mb-4 text-sm text-slate-600">
              Showing {tasksForSelectedDate.length} task(s) for{" "}
              <strong>{new Date(selectedDate).toLocaleDateString()}</strong>
            </div>

            {tasksForSelectedDate.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                <p className="text-sm">No tasks for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tasksForSelectedDate.map((task: any) => (
                  <div key={task.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{task.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                            ${task.priority === "HIGH" ? "bg-red-100 text-red-700" : ""}
                            ${task.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" : ""}
                            ${task.priority === "LOW" ? "bg-green-100 text-green-700" : ""}
                          `}>
                            {task.priority}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                            ${task.status === "TODO" ? "bg-slate-100 text-slate-700" : ""}
                            ${task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : ""}
                            ${task.status === "COMPLETED" ? "bg-green-100 text-green-700" : ""}
                          `}>
                            {task.status}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                        )}
                        {task.assignments && task.assignments.length > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-xs text-slate-500">Assigned to:</span>
                            {task.assignments.map((a: any) => (
                              <img
                                key={a.id}
                                src={
                                  a.employee?.profileImage
                                    ? a.employee.profileImage.startsWith("http")
                                      ? a.employee.profileImage
                                      : `${API_BASE}${a.employee.profileImage}`
                                    : "/default-avatar.svg"
                                }
                                alt={a.employee?.name}
                                title={a.employee?.name}
                                className="h-6 w-6 rounded-full object-cover border border-slate-200"
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-500">
                          Created: {new Date(task.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(task)}
                          className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input w-full"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="input w-full resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="input w-full"
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Assign Employees
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {employees.map((emp: any) => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editEmployees.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditEmployees([...editEmployees, emp.id]);
                          } else {
                            setEditEmployees(editEmployees.filter((id) => id !== emp.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={updateTask}
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  Update Task
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={loading}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
