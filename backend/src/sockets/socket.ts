import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import prisma from "../db/client";
import { sendPush } from "../utils/webpush";

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("socket connected", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`socket ${socket.id} joined user_${userId}`);
    });

    socket.on("disconnect", () => {
      // no-op
    });
  });
};

/**
 * Send real-time notification:
 *   - via socket.io (if user online)
 *   - via Web Push (if user has subscriptions)
 */
export const pushNotificationToUser = async (userId: number | string, payload: any) => {
  if (!io) return;

  // Socket.io notification
  io.to(`user_${userId}`).emit("notification_push", payload);

  // Web Push
  try {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: Number(userId) }
    });

    for (const s of subs) {
      try {
        const subscription = {
          endpoint: s.endpoint,
          keys: JSON.parse(s.keys || "{}")
        };
        await sendPush(subscription, payload);
      } catch (err) {
        console.warn("Failed to send web push for subscription:", s.endpoint, err);
      }
    }
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
  }
};

/**
 * Generic task event broadcast
 */
export const emitTaskEvent = (eventName: string, payload: any) => {
  if (!io) {
    console.error("Socket.io not initialized, cannot emit event:", eventName);
    return;
  }
  console.log("Emitting socket event:", eventName, "payload:", JSON.stringify(payload, null, 2));
  io.emit(eventName, payload);
};
