import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import api from "../../api/api";
import TaskCard from "../../components/TaskCard";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";
import { socket } from "../../socket/socket";
import ActivityNotificationStack from "../../components/ActivityNotificationStack";

type Columns = {
  TODO: any[];
  IN_PROGRESS: any[];
  COMPLETED: any[];
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ColleagueBoard() {
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [selectedColleagueId, setSelectedColleagueId] = useState<number | null>(null);
  const [columns, setColumns] = useState<Columns>({
    TODO: [],
    IN_PROGRESS: [],
    COMPLETED: []
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchColleagues = async (id: number) => {
    try {
      const r = await api.get(`/employee/${id}/colleagues`);
      const colleaguesList = r.data.colleagues || [];
      setColleagues(colleaguesList);
      if (colleaguesList.length > 0 && !selectedColleagueId) {
        setSelectedColleagueId(colleaguesList[0].id);
        await fetchColleagueBoard(colleaguesList[0].id);
      }
    } catch {
      toast.error("Failed to load colleagues");
    }
  };

  const fetchColleagueBoard = async (colleagueId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/employee/${colleagueId}/board`);
      setColumns(res.data);
    } catch (e) {
      toast.error("Failed to load colleague's board");
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
        await fetchColleagues(id);

        socket.connect();
        socket.on("task_status_changed", () => {
          if (selectedColleagueId) fetchColleagueBoard(selectedColleagueId);
        });
        socket.on("task_created", () => {
          if (selectedColleagueId) fetchColleagueBoard(selectedColleagueId);
        });
        socket.on("task_assigned", () => {
          if (selectedColleagueId) fetchColleagueBoard(selectedColleagueId);
        });
        socket.on("task_unassigned", () => {
          if (selectedColleagueId) fetchColleagueBoard(selectedColleagueId);
        });
        socket.on("task_updated", () => {
          if (selectedColleagueId) fetchColleagueBoard(selectedColleagueId);
        });
        socket.on("task_deleted", () => {
          if (selectedColleagueId) fetchColleagueBoard(selectedColleagueId);
        });
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
  }, [selectedColleagueId]);

  const handleColleagueSelect = async (colleagueId: number) => {
    setSelectedColleagueId(colleagueId);
    await fetchColleagueBoard(colleagueId);
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
            rounded-xl p-4 min-h-[400px] flex flex-col transition-all
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
              {columns[key].length}
            </span>
          </div>

          {/* Empty State */}
          {columns[key].length === 0 && (
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
              <p className="text-xs">No tasks</p>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {columns[key].map((task: any, index: number) => (
              <div
                key={task.id}
                className="transition-all"
              >
                <TaskCard task={task} />
              </div>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Loading colleague's board..." />}
      <Header role="EMPLOYEE" title="Colleague Progress" showBack={true} />

      <main className="flex-1 flex p-6">
        <div className="max-w-7xl mx-auto w-full flex gap-6">
          {/* Sidebar with colleagues */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Your Team</h3>
              <div className="space-y-2">
                {colleagues.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No colleagues in your team
                  </p>
                ) : (
                  colleagues.map((colleague) => (
                    <button
                      key={colleague.id}
                      onClick={() => handleColleagueSelect(colleague.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                        selectedColleagueId === colleague.id
                          ? "bg-indigo-100 text-indigo-900 font-medium"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {colleague.profileImage ? (
                        <img
                          src={
                            colleague.profileImage.startsWith("http")
                              ? colleague.profileImage
                              : `${API_BASE}${colleague.profileImage}`
                          }
                          alt={colleague.name}
                          className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {colleague.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{colleague.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Colleague's board */}
          <div className="flex-1">
            {selectedColleagueId && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  {colleagues.find((c) => c.id === selectedColleagueId)?.name}'s Progress
                </h2>
                <DragDropContext onDragEnd={(result) => {}}>
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
            )}
            {colleagues.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                <p className="text-slate-500 text-sm">
                  No colleagues available. You'll see your team members' progress here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <ActivityNotificationStack />
    </div>
  );
}
