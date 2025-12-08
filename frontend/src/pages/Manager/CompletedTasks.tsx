import React, { useEffect, useState } from "react";
import api from "../../api/api";
import TaskCard from "../../components/TaskCard";
import GlassCard from "../../components/GlassCard";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";

export default function CompletedTasks() {
  const managerId = 1; // TODO: from auth/me
  const [tasks, setTasks] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/manager/${managerId}/completed`);
      setTasks(res.data);
    } catch {
      toast.error("Failed to load completed tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Loading completed tasks..." />}
      <Header role="MANAGER" title="Completed Tasks" showBack={true} />

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <GlassCard>
            <div className="space-y-3 text-sm">
              <input
                className="input"
                placeholder="Search by title"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {filtered.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p className="text-sm">
                    {tasks.length === 0 ? "No completed tasks yet" : "No tasks match your search"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filtered.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
