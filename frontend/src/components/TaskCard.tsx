import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import api from "../api/api";

const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:4000";

function priorityClass(priority: string) {
  const p = String(priority || "").toUpperCase();
  if (p === "HIGH") return "badge badge-high";
  if (p === "MEDIUM") return "badge badge-medium";
  return "badge badge-low";
}

export default function TaskCard({ task, isManager = false, availableEmployees = [], onTaskUpdate = null }: any) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [selectedForAssign, setSelectedForAssign] = useState<number[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editEmployees, setEditEmployees] = useState<number[]>(
    task.assignments?.filter((a: any) => !a.unassignedAt).map((a: any) => a.employeeId) || []
  );
  const assignButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Update dropdown position on open or scroll
  useEffect(() => {
    if (!showAssignDropdown || !assignButtonRef.current) return;

    const updatePosition = () => {
      const btn = assignButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const dropdownWidth = 200;
      const dropdownHeight = 250;

      // Use viewport-relative coordinates for fixed positioning
      let left = rect.left;
      let top = rect.bottom + 8;

      // Adjust horizontally if it goes off-screen
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      if (left < 10) {
        left = 10;
      }

      // Adjust vertically - if dropdown goes below viewport, show it above the button
      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 8;
      }

      setDropdownStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        zIndex: 9999
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showAssignDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showAssignDropdown) return;

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      if (assignButtonRef.current && assignButtonRef.current.contains(target)) return;
      setShowAssignDropdown(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showAssignDropdown]);

  const handleAssignMultiple = async () => {
    if (selectedForAssign.length === 0) return;
    try {
      setAssignLoading(true);
      await Promise.all(
        selectedForAssign.map((empId) =>
          api.post(`/tasks/${task.id}/assign`, { employeeId: empId })
        )
      );
      setShowAssignDropdown(false);
      setSelectedForAssign([]);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error("Failed to assign employees:", error);
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedForAssign((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleUnassignEmployee = async (assignmentId: number) => {
    try {
      setAssignLoading(true);
      await api.post(`/tasks/assignment/${assignmentId}/unassign`);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error("Failed to unassign employee:", error);
    } finally {
      setAssignLoading(false);
    }
  };

  const openEditModal = () => {
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
    setEditEmployees(task.assignments?.filter((a: any) => !a.unassignedAt).map((a: any) => a.employeeId) || []);
    setShowEditModal(true);
  };

  const updateTask = async () => {
    if (!editTitle.trim()) {
      alert("Task title is required");
      return;
    }

    try {
      setEditLoading(true);
      await api.put(`/tasks/${task.id}`, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        assignedEmployeeIds: editEmployees,
      });
      setShowEditModal(false);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error: any) {
      console.error("Failed to update task:", error);
      alert(error?.response?.data?.message || "Failed to update task");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      setEditLoading(true);
      await api.delete(`/tasks/${task.id}`);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      alert(error?.response?.data?.message || "Failed to delete task");
    } finally {
      setEditLoading(false);
    }
  };

  const assignedEmployeeIds = task.assignments?.filter((a: any) => !a.unassignedAt).map((a: any) => a.employeeId) || [];
  const unassignedEmployees = availableEmployees.filter(
    (emp: any) => !assignedEmployeeIds.includes(emp.id)
  );
  const created = task.createdAt ? new Date(task.createdAt).toLocaleString() : "";
  const completed = task.completedAt
    ? new Date(task.completedAt).toLocaleString()
    : "";

  return (
    <div className="task-card bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
      <div className="flex justify-between gap-2 mb-1">
        <div className="flex-1">
          <div className="font-semibold text-sm">{task.title}</div>
          {task.description && (
            <div className="text-xs text-slate-600">{task.description}</div>
          )}
        </div>
        <div className="flex gap-1">
          {isManager && (
            <>
              <button
                onClick={openEditModal}
                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                title="Edit task"
              >
                ✎
              </button>
              <button
                onClick={deleteTask}
                disabled={editLoading}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                title="Delete task"
              >
                🗑
              </button>
            </>
          )}
          <div className={priorityClass(task.priority)}>{task.priority}</div>
        </div>
      </div>

      {/* Assignees with Profile Photos */}
      {task.assignments && task.assignments.length > 0 && (
        <div className="mt-2 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-500 font-medium">Assigned to:</span>
            {isManager && (
              <div>
                <button
                  ref={assignButtonRef}
                  onClick={() => {
                    setShowAssignDropdown(!showAssignDropdown);
                    setSelectedForAssign([]);
                  }}
                  className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                  disabled={assignLoading}
                >
                  + Assign
                </button>
                {showAssignDropdown &&
                  ReactDOM.createPortal(
                    <div
                      ref={dropdownRef}
                      style={dropdownStyle}
                      className="bg-white border border-slate-200 rounded-lg shadow-lg"
                    >
                      {unassignedEmployees.length > 0 ? (
                        <div className="space-y-2 p-3">
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {unassignedEmployees.map((emp: any) => (
                              <label
                                key={emp.id}
                                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedForAssign.includes(emp.id)}
                                  onChange={() => toggleEmployeeSelection(emp.id)}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                                />
                                <img
                                  src={
                                    emp.profileImage
                                      ? emp.profileImage.startsWith("http")
                                        ? emp.profileImage
                                        : `${API_BASE}${emp.profileImage}`
                                      : "/default-avatar.svg"
                                  }
                                  alt={emp.name || emp.username}
                                  className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                                />
                                <span className="text-xs flex-1">{emp.name || emp.username}</span>
                              </label>
                            ))}
                          </div>
                          
                          {selectedForAssign.length > 0 && (
                            <div className="border-t border-slate-200 pt-2">
                              <div className="text-[10px] text-slate-600 mb-2">
                                {selectedForAssign.length} employee(s) selected
                              </div>
                              <button
                                onClick={handleAssignMultiple}
                                disabled={assignLoading}
                                className="w-full text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50"
                              >
                                {assignLoading ? "Assigning..." : "Assign Selected"}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-500 text-center">
                          All employees assigned
                        </div>
                      )}
                    </div>,
                    document.body
                  )}
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {task.assignments?.filter((a: any) => !a.unassignedAt).map((assignment: any) => {
              const emp = assignment.employee || {};
              const displayName = emp.name || emp.username || "Unknown";
              const imgSrc = emp.profileImage
                ? emp.profileImage.startsWith("http")
                  ? emp.profileImage
                  : `${API_BASE}${emp.profileImage}`
                : "/default-avatar.svg";

              return (
                <div key={assignment.id} className="relative group inline-block">
                  <div className="flex items-center gap-1 bg-slate-50 rounded-full pl-1 pr-2 py-0.5 text-[10px]">
                    <img
                      src={imgSrc}
                      alt={displayName}
                      className="h-5 w-5 rounded-full object-cover border border-slate-200"
                    />
                    <span className="truncate max-w-[100px]">{displayName}</span>
                    {isManager && task.assignments?.filter((a: any) => !a.unassignedAt).length > 1 && (
                      <button
                        onClick={() => handleUnassignEmployee(assignment.id)}
                        disabled={assignLoading}
                        className="ml-1 text-slate-400 hover:text-red-500 transition text-[10px] font-bold"
                        title="Remove from task"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {displayName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>Created: {created}</span>
        {completed && <span>Completed: {completed}</span>}
      </div>

      {/* Edit Modal */}
      {showEditModal &&
        ReactDOM.createPortal(
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    {availableEmployees.map((emp: any) => (
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
                        <img
                          src={
                            emp.profileImage
                              ? emp.profileImage.startsWith("http")
                                ? emp.profileImage
                                : `${API_BASE}${emp.profileImage}`
                              : "/default-avatar.svg"
                          }
                          alt={emp.name || emp.username}
                          className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-sm text-slate-700">{emp.name || emp.username}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={updateTask}
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    Update Task
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
