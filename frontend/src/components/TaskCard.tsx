import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import api from "../api/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function priorityClass(priority: string) {
  const p = String(priority || "").toUpperCase();
  if (p === "HIGH") return "badge badge-high";
  if (p === "MEDIUM") return "badge badge-medium";
  return "badge badge-low";
}

export default function TaskCard({ task, isManager = false, availableEmployees = [], onTaskUpdate = null }: any) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
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

  const handleAssignEmployee = async (employeeId: number) => {
    try {
      setAssignLoading(true);
      await api.post(`/tasks/${task.id}/assign`, { employeeId });
      setShowAssignDropdown(false);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error("Failed to assign employee:", error);
    } finally {
      setAssignLoading(false);
    }
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
        <div className={priorityClass(task.priority)}>{task.priority}</div>
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
                  onClick={() => setShowAssignDropdown(!showAssignDropdown)}
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
                        <div className="max-h-48 overflow-y-auto">
                          {unassignedEmployees.map((emp: any) => (
                            <button
                              key={emp.id}
                              onClick={() => handleAssignEmployee(emp.id)}
                              disabled={assignLoading}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 transition flex items-center gap-2 text-xs border-b last:border-0"
                            >
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
                              <span>{emp.name || emp.username}</span>
                            </button>
                          ))}
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
    </div>
  );
}
