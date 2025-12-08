import { io } from "socket.io-client";

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:4000").replace("/api", "");

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});

export const joinRoom = (userId: number) => {
  if (!socket.connected) socket.connect();
  socket.emit("join", String(userId));
};
