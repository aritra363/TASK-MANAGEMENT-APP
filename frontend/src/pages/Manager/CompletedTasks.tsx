import React, { useEffect, useState } from "react";
import api from "../../api/api";
import TaskCard from "../../components/TaskCard";
import GlassCard from "../../components/GlassCard";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";

interface Employee {
  id: number;
  name: string;
}

export default function CompletedTasks() {
  const { user } = useAuth();
  const managerId = user?.id;

  // Set default date to today
  const getDefaultDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "employee">("title");
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [loading, setLoading] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedTaskForReassign, setSelectedTaskForReassign] = useState<any>(null);
  const [selectedEmployeesForReassign, setSelectedEmployeesForReassign] = useState<number[]>([]);
  const [reassignLoading, setReassignLoading] = useState(false);
  const toast = useToast();

  // Fetch employees for reassign dropdown
  useEffect(() => {
    if (!managerId) return;
    const fetchEmployees = async () => {
      try {
        const res = await api.get(`/manager/${managerId}/employees`);
        setEmployees(res.data);
      } catch {
        console.error("Failed to load employees");
      }
    };
    fetchEmployees();
  }, [managerId]);

  const fetchTasks = async (query: string = searchQuery, type: string = searchType, date: string = selectedDate) => {
    if (!managerId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) {
        params.append("q", query);
        params.append("searchType", type);
      }
      if (date) {
        params.append("date", date);
      }

      const res = await api.get(
        `/manager/${managerId}/completed?${params.toString()}`
      );
      setTasks(res.data);
    } catch {
      toast.error("Failed to load completed tasks");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on date change (immediate)
  useEffect(() => {
    fetchTasks(searchQuery, searchType, selectedDate);
  }, [managerId, selectedDate]);

  // Handle search input with Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchTasks();
    }
  };

  // Handle search button click
  const handleSearch = () => {
    fetchTasks();
  };

  // Handle clearing search - pass empty string
  const handleClearSearch = () => {
    setSearchQuery("");
    fetchTasks("", searchType, selectedDate);
  };

  // Handle reassigning task to multiple employees
  const handleReassign = async () => {
    if (!selectedTaskForReassign || selectedEmployeesForReassign.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    try {
      setReassignLoading(true);

      // First, unassign ALL currently assigned employees
      if (selectedTaskForReassign.assignments && selectedTaskForReassign.assignments.length > 0) {
        const assignmentsToRemove = selectedTaskForReassign.assignments
          .filter((a: any) => !a.unassignedAt)
          .map((a: any) => a.id);

        await Promise.all(
          assignmentsToRemove.map((assignmentId: number) =>
            api.post(`/tasks/assignment/${assignmentId}/unassign`)
          )
        );
      }

      // Then, assign ONLY the newly selected employees
      await Promise.all(
        selectedEmployeesForReassign.map((empId) =>
          api.post(`/tasks/${selectedTaskForReassign.id}/assign`, {
            employeeId: empId
          })
        )
      );

      toast.success("Task reassigned successfully");
      setReassignModalOpen(false);
      setSelectedTaskForReassign(null);
      setSelectedEmployeesForReassign([]);
      fetchTasks(searchQuery, searchType, selectedDate);
    } catch {
      toast.error("Failed to reassign task");
    } finally {
      setReassignLoading(false);
    }
  };

  // Toggle employee selection
  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployeesForReassign((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Loading completed tasks..." />}
      <Header role="MANAGER" title="Completed Tasks" showBack={true} />

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Filter Card */}
          <GlassCard>
            <div className="space-y-4 text-sm">
              <div className="font-semibold text-slate-900">Search & Filter</div>

              {/* Search Section */}
              <div className="space-y-2">
                <label className="block font-medium text-slate-700">
                  Search By
                </label>
                <div className="flex gap-2">
                  <select
                    className="input flex-1"
                    value={searchType}
                    onChange={(e) =>
                      setSearchType(e.target.value as "title" | "employee")
                    }
                  >
                    <option value="title">Task Title</option>
                    <option value="employee">Employee Name</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder={
                      searchType === "title"
                        ? "Search by task title..."
                        : "Search by employee name..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  <button
                    onClick={handleSearch}
                    className="btn-primary px-4 py-2 whitespace-nowrap"
                  >
                    🔍 Search
                  </button>
                </div>
              </div>

              {/* Date Filter Section */}
              <div className="space-y-2">
                <label className="block font-medium text-slate-700">
                  Completion Date
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Active Filters Summary */}
              {(searchQuery || selectedDate) && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                        {searchType === "title"
                          ? "Title"
                          : "Employee"}
                        : {searchQuery}
                        <button
                          onClick={handleClearSearch}
                          className="ml-1 font-bold hover:text-blue-900"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {selectedDate && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                        Date: {new Date(selectedDate).toLocaleDateString()}
                        <button
                          onClick={() => setSelectedDate("")}
                          className="ml-1 font-bold hover:text-green-900"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Tasks List Card */}
          <GlassCard>
            <div className="space-y-3 text-sm">
              <div className="font-semibold text-slate-900">
                Completed Tasks ({tasks.length})
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">
                    {searchQuery || selectedDate
                      ? "No tasks match your search criteria"
                      : "No completed tasks yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            {task.description}
                          </p>

                          {/* Assigned Employees */}
                          {task.assignments && task.assignments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {task.assignments
                                .filter((a: any) => !a.unassignedAt) // Only show currently assigned
                                .map((a: any) => (
                                  <span
                                    key={a.id}
                                    className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                                  >
                                    {a.employee?.name || "Unknown"}
                                  </span>
                                ))}
                            </div>
                          )}

                          {/* Completion Date */}
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <span className="text-green-600 font-medium">
                              ✓ Completed
                            </span>
                            {task.completedAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(task.completedAt)}</span>
                              </>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedTaskForReassign(task);
                                setSelectedEmployeesForReassign([]);
                                setReassignModalOpen(true);
                              }}
                              className="btn-secondary text-xs px-3 py-1"
                            >
                              🔄 Reassign
                            </button>
                          </div>
                        </div>

                        {/* Priority Badge */}
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            task.priority === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {task.priority}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </main>

      {/* Reassign Modal */}
      {reassignModalOpen && selectedTaskForReassign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">
                Reassign Task
              </h2>
              <button
                onClick={() => {
                  setReassignModalOpen(false);
                  setSelectedTaskForReassign(null);
                  setSelectedEmployeesForReassign([]);
                }}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                <strong>Task:</strong> {selectedTaskForReassign.title}
              </p>

              {/* Show currently assigned employees that will be replaced */}
              {selectedTaskForReassign.assignments && selectedTaskForReassign.assignments.filter((a: any) => !a.unassignedAt).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                  <p className="text-xs font-medium text-red-900">
                    ❌ These employees will be removed:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTaskForReassign.assignments
                      .filter((a: any) => !a.unassignedAt)
                      .map((a: any) => (
                        <span
                          key={a.id}
                          className="bg-red-200 text-red-800 px-3 py-1 rounded text-xs font-medium"
                        >
                          {a.employee?.name || "Unknown"}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-600">
                <strong>Select New Employees to Assign:</strong>
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded p-3">
                {employees.length === 0 ? (
                  <p className="text-sm text-slate-500">No employees available</p>
                ) : (
                  employees.map((emp) => {
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 p-2 rounded cursor-pointer transition hover:bg-blue-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployeesForReassign.includes(emp.id)}
                          onChange={() => toggleEmployeeSelection(emp.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-900">
                          {emp.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {selectedEmployeesForReassign.length > 0 && (
                <div className="text-xs text-green-600 font-medium">
                  ✅ {selectedEmployeesForReassign.length} employee(s) selected for assignment
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <button
                onClick={() => {
                  setReassignModalOpen(false);
                  setSelectedTaskForReassign(null);
                  setSelectedEmployeesForReassign([]);
                }}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={reassignLoading || selectedEmployeesForReassign.length === 0}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                {reassignLoading ? "Reassigning..." : "Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
