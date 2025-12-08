import React, { useEffect, useState } from "react";
import { socket } from "../socket/socket";

type N = { id: string; title: string; body?: string };

export default function NotificationStack() {
  const [notes, setNotes] = useState<N[]>([]);

  useEffect(() => {
    const handler = (payload: any) => {
      const id = String(Date.now()) + Math.random();
      const note = {
        id,
        title: payload.type || "Notification",
        body: payload.message || ""
      };
      setNotes((s) => [note, ...s]);
      setTimeout(() => {
        setNotes((s) => s.filter((x) => x.id !== id));
      }, 7000);
    };

    socket.on("notification_push", handler);
    return () => {
      socket.off("notification_push", handler);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 space-y-3 z-40">
      {notes.map((n) => (
        <div
          key={n.id}
          className="glass px-4 py-3 w-80 shadow-lg border border-slate-200"
        >
          <div className="text-xs font-semibold text-slate-800 mb-1">
            {n.title}
          </div>
          <div className="text-xs text-slate-600">{n.body}</div>
        </div>
      ))}
    </div>
  );
}
