import { Request, Response } from "express";
import prisma from "../db/client";

export const getManagerBoards = async (req: Request, res: Response) => {
  const managerId = Number(req.params.managerId);
  const employees = await prisma.user.findMany({ where: { managerId } });
  const employeeIds = employees.map((e) => e.id);

  const tasks = await prisma.task.findMany({
    include: { assignments: { include: { employee: true } } }
  });

  const TODO = tasks.filter(
    (t) =>
      t.status === "TODO" &&
      t.assignments.some((a) => employeeIds.includes(a.employeeId))
  );
  const IN_PROGRESS = tasks.filter(
    (t) =>
      t.status === "IN_PROGRESS" &&
      t.assignments.some((a) => employeeIds.includes(a.employeeId))
  );
  const COMPLETED = tasks.filter(
    (t) =>
      t.status === "COMPLETED" &&
      t.assignments.some((a) => employeeIds.includes(a.employeeId))
  );

  res.json({ TODO, IN_PROGRESS, COMPLETED });
};

export const getCompletedTasksForManager = async (req: Request, res: Response) => {
  const managerId = Number(req.params.managerId);
  const { q, date, searchType } = req.query;

  const employees = await prisma.user.findMany({ where: { managerId } });
  const employeeIds = employees.map((e) => e.id);

  const whereAny: any = {
    status: "COMPLETED",
    assignments: { some: { employeeId: { in: employeeIds }, unassignedAt: null } } // Only currently assigned
  };

  // Filter by completion date
  if (date) {
    const d = new Date(String(date));
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    whereAny.completedAt = { gte: start, lte: end };
  }

  let tasks = await prisma.task.findMany({
    where: whereAny,
    include: {
      assignments: {
        where: { unassignedAt: null }, // Only include currently assigned employees
        include: {
          employee: true
        }
      }
    },
    orderBy: { completedAt: "desc" }
  });

  // Filter by search query in application code (supports both title and employee name)
  if (q) {
    const searchValue = String(q).toLowerCase();
    tasks = tasks.filter((task) => {
      if (searchType === "employee") {
        // Search by employee name (only from currently assigned employees)
        return task.assignments.some((a) =>
          a.employee?.name.toLowerCase().includes(searchValue)
        );
      } else {
        // Default: search by task title
        return task.title.toLowerCase().includes(searchValue);
      }
    });
  }

  res.json(tasks);
};

// List all tasks created by a manager (for Add Task page)
export const getTasksForManager = async (req: any, res: Response) => {
  try {
    const managerId = req.user.id; // enforce current manager
    const tasks = await prisma.task.findMany({
      where: { createdById: managerId },
      include: {
        assignments: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(tasks);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

// Employees under a manager (used by Add Task page)
export const getEmployeesOfManager = async (req: any, res: Response) => {
  const managerId = req.user.id; // enforce current manager
  const employees = await prisma.user.findMany({ where: { managerId } });
  res.json(employees);
};
