import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import api from "../../api/api";
import TaskCard from "../../components/TaskCard";
import { socket } from "../../socket/socket";
import ActivityNotificationStack from "../../components/ActivityNotificationStack";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";

type Columns = {
  TODO: any[];
  IN_PROGRESS: any[];
  COMPLETED: any[];
};

export default function MyBoard() {
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [cols, setCols] = useState<Columns>({
    TODO: [],
    IN_PROGRESS: [],
    COMPLETED: []
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchBoard = async (id: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/employee/${id}/board`);
      setCols(res.data);
    } catch (e) {
      toast.error("Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const id = res.data.user.id;
        setEmployeeId(id);
        await fetchBoard(id);
        
        socket.connect();
        socket.on("task_status_changed", () => fetchBoard(id));
        socket.on("task_created", () => fetchBoard(id));
        socket.on("task_assigned", () => fetchBoard(id));
        socket.on("task_unassigned", () => fetchBoard(id));
        socket.on("task_updated", () => fetchBoard(id));
        socket.on("task_deleted", () => fetchBoard(id));
      } catch (e) {
        toast.error("Failed to load your profile");
      }
    })();

    return () => {
      socket.off("task_status_changed");
      socket.off("task_created");
      socket.off("task_assigned");
      socket.off("task_unassigned");
      socket.off("task_updated");
      socket.off("task_deleted");
      // Don't disconnect - keep socket alive for other components
    };
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId as "TODO" | "IN_PROGRESS" | "COMPLETED";
    try {
      setLoading(true);
      await api.post(`/tasks/${draggableId}/move`, { to: newStatus });
      toast.success(`Task updated to ${newStatus.replace(/_/g, " ")}`);
      if (employeeId) await fetchBoard(employeeId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
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
            rounded-xl p-4 min-h-[450px] flex flex-col transition-all
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
              {cols[key].length}
            </span>
          </div>

          {/* Empty State */}
          {cols[key].length === 0 && (
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
              <p className="text-xs">No tasks here yet</p>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {cols[key].map((t: any, index: number) => (
              <Draggable key={t.id} draggableId={String(t.id)} index={index}>
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
                    <TaskCard task={t} />
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
      <Header role="EMPLOYEE" title="My Progress Board" showBack={true} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
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
      </main>
      <ActivityNotificationStack />
    </div>
  );
}
