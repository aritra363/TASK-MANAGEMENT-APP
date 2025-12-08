import React, { useState, useEffect, useCallback } from "react";
import { socket } from "../socket/socket";
import api from "../api/api";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface ActivityNotification {
  id: string;
  action: string;
  actor: { id: number; name: string; username: string; profileImage?: string | null };
  timestamp: number;
  type: string;
}

export default function ActivityNotificationStack() {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const addNotification = useCallback(
    (data: Omit<ActivityNotification, "id" | "timestamp">) => {
      const id = `${Date.now()}-${Math.random()}`;
      const notification: ActivityNotification = {
        ...data,
        id,
        timestamp: Date.now()
      };
      setNotifications((prev) => [notification, ...prev]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Fetch current user ID on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const userId = res.data.user.id;
        setCurrentUserId(userId);
        
        // Make sure socket is connected
        if (!socket.connected) {
          socket.connect();
        }
        console.log("Socket connected for user", userId);
        
        // Add a catch-all listener to see ALL socket events
        socket.onAny((eventName: string, ...args: any[]) => {
          console.log("Socket event received:", eventName, args);
        });
      } catch (e) {
        console.error("Failed to get current user", e);
      }
    })();
    
    return () => {
      // Don't disconnect here - keep socket alive for other pages
    };
  }, []);

  // Set up socket listeners when currentUserId is available
  useEffect(() => {
    if (!currentUserId) return; // Don't set up listeners until we have currentUserId
    
    console.log("Setting up socket listeners for user", currentUserId);
    
    // Create handler functions with currentUserId and addNotification in closure
    const handleTaskAssigned = (data: any) => {
      console.log("task_assigned received:", data);
      console.log("currentUserId:", currentUserId, "type:", typeof currentUserId);
      console.log("data.employee:", data.employee, "data.employee?.id:", data.employee?.id, "type:", typeof data.employee?.id);
      console.log("data.actor:", data.actor, "data.task:", data.task);

      if (data.actor && data.employee) {
        // Convert to numbers for comparison to handle string/number type issues
        const empId = Number(data.employee.id);
        const curId = Number(currentUserId);
        const actorId = Number(data.actor.id);
        const creatorId = data.task ? Number(data.task.createdById) : null;

        const isEmployee = curId === empId;
        const isManager = creatorId !== null && curId === creatorId;
        const isActor = curId === actorId;

        console.log("task_assigned - empId:", empId, "curId:", curId, "creatorId:", creatorId, "actorId:", actorId);
        console.log("task_assigned - isEmployee:", isEmployee, "isManager:", isManager, "isActor:", isActor);

        const isAffected = (isEmployee || isManager);
        if (isAffected && !isActor) {
          console.log("Showing notification for task_assigned");
          addNotification({
            action: data.action,
            actor: { id: data.actor.id, name: data.actor.name, username: data.actor.username, profileImage: data.actor.profileImage },
            type: "task_assigned"
          });
        }
      }
    };

    const handleTaskUnassigned = (data: any) => {
      console.log("task_unassigned received:", data);
      if (data.actor && data.employee) {
        // Convert to numbers for comparison to handle string/number type issues
        const empId = Number(data.employee.id);
        const curId = Number(currentUserId);
        const actorId = Number(data.actor.id);
        const creatorId = data.task ? Number(data.task.createdById) : null;

        const isEmployee = curId === empId;
        const isManager = creatorId !== null && curId === creatorId;
        const isActor = curId === actorId;

        console.log("task_unassigned - empId:", empId, "curId:", curId, "creatorId:", creatorId, "actorId:", actorId);
        console.log("task_unassigned - isEmployee:", isEmployee, "isManager:", isManager, "isActor:", isActor);

        const isAffected = (isEmployee || isManager);
        if (isAffected && !isActor) {
          console.log("Showing notification for task_unassigned");
          addNotification({
            action: data.action,
            actor: { id: data.actor.id, name: data.actor.name, username: data.actor.username, profileImage: data.actor.profileImage },
            type: "task_unassigned"
          });
        }
      }
    };

    const handleTaskStatusChanged = (data: any) => {
      console.log("task_status_changed received:", data);
      if (data.actor && data.task) {
        const curId = Number(currentUserId);
        const actorId = Number(data.actor.id);
        const creatorId = data.task ? Number(data.task.createdById) : null;
        const isAssigned =
          data.task?.assignments?.some((a: any) => Number(a.employeeId) === curId && !a.unassignedAt);
        const isManager = creatorId !== null && curId === creatorId;
        const isActor = curId === actorId;
        const isAffected = (isAssigned || isManager);
        console.log("task_status_changed - isAssigned:", isAssigned, "isManager:", isManager, "isActor:", isActor);
        if (isAffected && !isActor) {
          console.log("Showing notification for task_status_changed");
          addNotification({
            action: data.action,
            actor: { id: data.actor.id, name: data.actor.name, username: data.actor.username, profileImage: data.actor.profileImage },
            type: "task_status_changed"
          });
        }
      }
    };

    const handleTaskCreated = (data: any) => {
      console.log("task_created received:", data);
      if (data.task && data.actor) {
        const curId = Number(currentUserId);
        const actorId = Number(data.actor.id);
        const creatorId = data.task ? Number(data.task.createdById) : null;
        const isAssigned =
          data.task?.assignments?.some((a: any) => Number(a.employeeId) === curId && !a.unassignedAt);
        const isManager = creatorId !== null && curId === creatorId;
        const isActor = curId === actorId;
        const isAffected = (isAssigned || isManager);
        console.log("task_created - isAssigned:", isAssigned, "isManager:", isManager, "isActor:", isActor);
        if (isAffected && !isActor) {
          console.log("Showing notification for task_created");
          addNotification({
            action: `created task: "${data.task.title}"`,
            actor: { id: data.actor.id, name: data.actor.name, username: data.actor.username, profileImage: data.actor.profileImage },
            type: "task_created"
          });
        }
      }
    };

    const handleTaskUpdated = (data: any) => {
      console.log("task_updated received:", data);
      if (data.task && data.actor) {
        const curId = Number(currentUserId);
        const actorId = Number(data.actor.id);
        const creatorId = data.task ? Number(data.task.createdById) : null;
        const isAssigned =
          data.task?.assignments?.some((a: any) => Number(a.employeeId) === curId && !a.unassignedAt);
        const isManager = creatorId !== null && curId === creatorId;
        const isActor = curId === actorId;
        const isAffected = (isAssigned || isManager);
        console.log("task_updated - isAssigned:", isAssigned, "isManager:", isManager, "isActor:", isActor);
        if (isAffected && !isActor) {
          console.log("Showing notification for task_updated");
          addNotification({
            action: `updated task: "${data.task.title}"`,
            actor: { id: data.actor.id, name: data.actor.name, username: data.actor.username, profileImage: data.actor.profileImage },
            type: "task_updated"
          });
        }
      }
    };

    const handleTaskDeleted = (data: any) => {
      console.log("task_deleted received:", data);
      if (data.actor) {
        const curId = Number(currentUserId);
        const actorId = Number(data.actor.id);
        const isAffected = data.assignedEmployeeIds?.some((id: any) => Number(id) === curId);
        const isActor = curId === actorId;
        console.log("task_deleted - isAffected:", isAffected, "isActor:", isActor);
        if (isAffected && !isActor) {
          console.log("Showing notification for task_deleted");
          addNotification({
            action: data.action,
            actor: { id: data.actor.id, name: data.actor.name, username: data.actor.username, profileImage: data.actor.profileImage },
            type: "task_deleted"
          });
        }
      }
    };

    // Register listeners
    socket.on("task_assigned", handleTaskAssigned);
    socket.on("task_unassigned", handleTaskUnassigned);
    socket.on("task_status_changed", handleTaskStatusChanged);
    socket.on("task_created", handleTaskCreated);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("task_deleted", handleTaskDeleted);

    // Cleanup: Remove old listeners
    return () => {
      socket.off("task_assigned", handleTaskAssigned);
      socket.off("task_unassigned", handleTaskUnassigned);
      socket.off("task_status_changed", handleTaskStatusChanged);
      socket.off("task_created", handleTaskCreated);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("task_deleted", handleTaskDeleted);
    };
  }, [currentUserId, addNotification]);

  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "👤";
      case "task_unassigned":
        return "❌";
      case "task_status_changed":
        return "🔄";
      case "task_created":
        return "✨";
      case "task_updated":
        return "✏️";
      case "task_deleted":
        return "🗑️";
      default:
        return "📢";
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "from-blue-500 to-blue-600";
      case "task_unassigned":
        return "from-red-500 to-red-600";
      case "task_status_changed":
        return "from-purple-500 to-purple-600";
      case "task_created":
        return "from-green-500 to-green-600";
      case "task_updated":
        return "from-amber-500 to-amber-600";
      case "task_deleted":
        return "from-rose-500 to-rose-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`animate-slide-in bg-gradient-to-r ${getColor(
            notif.type
          )} text-white rounded-lg shadow-lg p-4 flex items-start gap-3 group hover:shadow-xl transition-shadow`}
        >
          <span className="text-xl flex-shrink-0">{getIcon(notif.type)}</span>
          <img
            src={
              notif.actor.profileImage
                ? notif.actor.profileImage.startsWith("http")
                  ? notif.actor.profileImage
                  : `${API_BASE}${notif.actor.profileImage}`
                : "/default-avatar.svg"
            }
            alt={notif.actor.name || notif.actor.username}
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{notif.actor.name || notif.actor.username}</p>
            <p className="text-xs opacity-90 line-clamp-2">{notif.action}</p>
          </div>
          <button
            onClick={() => removeNotification(notif.id)}
            className="flex-shrink-0 opacity-75 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
