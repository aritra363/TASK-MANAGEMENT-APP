import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import tasksRoutes from "./routes/tasks";
import managerRoutes from "./routes/manager";
import employeeRoutes from "./routes/employee";
import pushRoutes from "./routes/push";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// serve uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/tasks", tasksRoutes);
app.use("/manager", managerRoutes);
app.use("/employee", employeeRoutes);
app.use("/push", pushRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

export default app;
