import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import api from "../../api/api";
import TaskCard from "../../components/TaskCard";
import NotificationStack from "../../components/NotificationStack";
import ActivityNotificationStack from "../../components/ActivityNotificationStack";
import { socket } from "../../socket/socket";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";

type Columns = {
  TODO: any[];
  IN_PROGRESS: any[];
  COMPLETED: any[];
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function TaskBoard() {
  const [managerId, setManagerId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [allColumns, setAllColumns] = useState<Columns>({
    TODO: [],
    IN_PROGRESS: [],
    COMPLETED: []
  });
  const [filteredColumns, setFilteredColumns] = useState<Columns>({
    TODO: [],
    IN_PROGRESS: [],
    COMPLETED: []
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Check if a completed task is from today
  const isCompletedTaskFromToday = (task: any): boolean => {
    if (task.status !== "COMPLETED" || !task.completedAt) return true;
    const completedDate = new Date(task.completedAt);
    const today = new Date();
    return (
      completedDate.getFullYear() === today.getFullYear() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getDate() === today.getDate()
    );
  };

  const filterTasks = (cols: Columns, employeeId: number | null) => {
    if (!employeeId) {
      // Filter out completed tasks that are not from today
      return {
        TODO: cols.TODO,
        IN_PROGRESS: cols.IN_PROGRESS,
        COMPLETED: cols.COMPLETED.filter(isCompletedTaskFromToday)
      };
    }
    
    return {
      TODO: cols.TODO.filter((t) =>
        t.assignments?.some((a: any) => a.employeeId === employeeId && !a.unassignedAt)
      ),
      IN_PROGRESS: cols.IN_PROGRESS.filter((t) =>
        t.assignments?.some((a: any) => a.employeeId === employeeId && !a.unassignedAt)
      ),
      COMPLETED: cols.COMPLETED.filter((t) =>
        t.assignments?.some((a: any) => a.employeeId === employeeId && !a.unassignedAt) &&
        isCompletedTaskFromToday(t)
      )
    };
  };

  const fetchBoards = async (mgrId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/manager/${mgrId}/boards`);
      setAllColumns(res.data);
      setFilteredColumns(filterTasks(res.data, selectedEmployeeId));
      // Fetch employees using the freshly loaded columns (pass res.data)
      await fetchEmployees(mgrId, res.data);
    } catch (e) {
      toast.error("Failed to load task board");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (mgrId: number, columns?: Columns) => {
    try {
      setLoadingEmployees(true);
      const res = await api.get(`/manager/${mgrId}/employees`);
      
      // Keep all employees for the assign dropdown
      setAllEmployees(res.data);

      // Filter to only employees who have at least one assignment in allColumns
      const assignedEmployeeIds = new Set<number>();
      const counts: Record<number, number> = {};

      // Prefer columns argument (fresh data) otherwise fall back to state
      const srcColumns = columns || allColumns;
      Object.values(srcColumns).forEach((tasks) => {
        tasks.forEach((task: any) => {
          task.assignments?.forEach((a: any) => {
            // Skip unassigned assignments (where unassignedAt is set)
            if (a.unassignedAt) return;
            // assignment may include nested employee object or just employeeId
            const id = a.employeeId || (a.employee && a.employee.id);
            if (!id) return;
            assignedEmployeeIds.add(id);
            counts[id] = (counts[id] || 0) + 1;
          });
        });
      });

      const assignedEmployees = res.data
        .filter((emp: any) => assignedEmployeeIds.has(emp.id))
        .map((emp: any) => ({ ...emp, _taskCount: counts[emp.id] || 0 }));
      setEmployees(assignedEmployees);
    } catch (e) {
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const id = res.data.user.id;
        setManagerId(id);
        await fetchBoards(id);

        socket.connect();
        socket.on("task_status_changed", () => fetchBoards(id));
        socket.on("task_created", () => fetchBoards(id));
        socket.on("task_updated", () => fetchBoards(id));
        socket.on("task_assigned", () => fetchBoards(id));
        socket.on("task_unassigned", () => fetchBoards(id));
        socket.on("task_deleted", () => fetchBoards(id));
      } catch (e) {
        toast.error("Failed to load your profile");
      }
    })();

    return () => {
      socket.off("task_status_changed");
      socket.off("task_created");
      socket.off("task_updated");
      socket.off("task_assigned");
      socket.off("task_unassigned");
      socket.off("task_deleted");
      // Don't disconnect - keep socket alive for other components
    };
  }, []);

  // Auto-refresh at end of day to remove completed tasks
  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.getTime() - now.getTime();
    };

    const timeUntilMidnight = calculateTimeUntilMidnight();
    const timeoutId = setTimeout(() => {
      // Refresh board at midnight to filter out old completed tasks
      if (managerId) fetchBoards(managerId);
    }, timeUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, [managerId]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId as "TODO" | "IN_PROGRESS" | "COMPLETED";
    try {
      setLoading(true);
      await api.post(`/tasks/${draggableId}/move`, { to: newStatus });
      toast.success(`Task moved to ${newStatus.replace(/_/g, " ")}`);
      if (managerId) await fetchBoards(managerId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to move task");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (empId: number | null) => {
    setSelectedEmployeeId(empId);
    setFilteredColumns(filterTasks(allColumns, empId));
  };

  const renderColumn = (
    title: string,
    key: keyof Columns,
    bgColor: string,
    dotColor: string
  ) => (
    <Droppable droppableId={key} key={key}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            rounded-xl p-4 min-h-[500px] flex flex-col transition-all
            ${
              snapshot.isDraggingOver
                ? `${bgColor} shadow-lg scale-105`
                : `${bgColor} shadow-sm`
            }
          `}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${dotColor} shadow-sm`} />
              {title}
            </h3>
            <span className="text-xs font-medium text-slate-600 bg-white px-3 py-1 rounded-full">
              {filteredColumns[key].length}
            </span>
          </div>

          {/* Empty State */}
          {filteredColumns[key].length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <svg
                className="w-12 h-12 mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-xs">No tasks yet</p>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {filteredColumns[key].map((task: any, index: number) => (
              <Draggable
                key={task.id}
                draggableId={String(task.id)}
                index={index}
              >
                {(p, snapshot) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    className={`transition-all ${
                      snapshot.isDragging
                        ? "scale-105 shadow-2xl rotate-3"
                        : "shadow-sm"
                    }`}
                  >
                    <TaskCard 
                      task={task} 
                      isManager={true}
                      availableEmployees={allEmployees}
                      onTaskUpdate={() => managerId && fetchBoards(managerId)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Updating tasks..." />}
      <Header role="MANAGER" title="Task Board" showBack={true} />

      <main className="flex-1 flex p-6">
        <div className="max-w-7xl mx-auto w-full flex gap-6">
          {/* Sidebar with employees */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Filter by Employee</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleEmployeeSelect(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedEmployeeId === null
                      ? "bg-indigo-100 text-indigo-900 font-medium"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  👥 All Employees
                </button>
                {loadingEmployees ? (
                  // Loading skeleton for sidebar
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-full rounded-lg bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleEmployeeSelect(emp.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                        selectedEmployeeId === emp.id
                          ? "bg-indigo-100 text-indigo-900 font-medium"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
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
                      <span className="truncate">{emp.name || emp.username}</span>
                      <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{emp._taskCount || 0}</span>
                    </button>
                  ))
                )}
                {employees.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No employees yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Task board */}
          <div className="flex-1">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderColumn(
                  "📋 To Do",
                  "TODO",
                  "bg-gradient-to-br from-slate-50 to-slate-100",
                  "bg-slate-400"
                )}
                {renderColumn(
                  "⚙️ In Progress",
                  "IN_PROGRESS",
                  "bg-gradient-to-br from-blue-50 to-blue-100",
                  "bg-blue-500"
                )}
                {renderColumn(
                  "✅ Completed",
                  "COMPLETED",
                  "bg-gradient-to-br from-emerald-50 to-emerald-100",
                  "bg-emerald-500"
                )}
              </div>
            </DragDropContext>
          </div>
        </div>
      </main>

      <NotificationStack />
      <ActivityNotificationStack />
    </div>
  );
}
