import { Request, Response } from "express";
import prisma from "../db/client";

export const getEmployeeBoard = async (req: Request, res: Response) => {
  const employeeId = Number(req.params.employeeId);
  const assignments = await prisma.taskAssignment.findMany({ where: { employeeId, unassignedAt: null }, include: { task: true }});
  const tasks = assignments.map(a => a.task);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);

  const TODO = tasks.filter(t => t.status === "TODO");
  const IN_PROGRESS = tasks.filter(t => t.status === "IN_PROGRESS");
  const COMPLETED = tasks.filter(t => t.status === "COMPLETED" && t.completedAt && t.completedAt >= start && t.completedAt <= end);

  res.json({ TODO, IN_PROGRESS, COMPLETED });
};

export const getColleagues = async (req: Request, res: Response) => {
  const employeeId = Number(req.params.employeeId);
  const user = await prisma.user.findUnique({ where: { id: employeeId }});
  if (!user) return res.status(404).json({ message: "Not found" });
  if (!user.managerId) return res.json({ colleagues: [] });
  const colleagues = await prisma.user.findMany({ where: { managerId: user.managerId, id: { not: employeeId } }});
  res.json({ colleagues });
};
