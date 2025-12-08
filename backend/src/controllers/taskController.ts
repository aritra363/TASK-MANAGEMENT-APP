import { Request, Response } from "express";
import prisma from "../db/client";
import { pushNotificationToUser, emitTaskEvent } from "../sockets/socket";

// LIST tasks for the logged-in manager (for Add Task page)
export const listTasksForManager = async (req: Request, res: Response) => {
  const managerId = (req as any).user.id;
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
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignedEmployeeIds } = req.body;
    const user = (req as any).user;
    const createdById = user.id;

    if (!title || !priority) {
      return res.status(400).json({ message: "Title and priority are required" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        createdById,
        assignments: {
          create: (assignedEmployeeIds || []).map((eid: number) => ({
            employeeId: eid
          }))
        }
      },
      include: {
        assignments: {
          include: { employee: true }
        }
      }
    });

    for (const a of task.assignments) {
      await pushNotificationToUser(a.employeeId, {
        type: "task_assigned",
        message: `New task assigned: ${task.title}`,
        task
      });
    }
    emitTaskEvent("task_created", {
      task,
      actor: { id: user.id, name: user.name, username: user.username, profileImage: (user as any).profileImage || null },
      action: `created task: "${task.title}"`
    });
    res.status(201).json(task);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const data: any = req.body;
    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignments: { include: { employee: true } }
      }
    });
    emitTaskEvent("task_updated", {
      task,
      actor: { id: user.id, name: user.name, username: user.username, profileImage: (user as any).profileImage || null },
      action: `updated task: "${task.title}"`
    });
    res.json(task);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const task = await prisma.task.findUnique({ where: { id } });
    const assigns = await prisma.taskAssignment.findMany({ where: { taskId: id } });
    const assignedEmployeeIds = assigns.map(a => a.employeeId);
    
    for (const a of assigns) {
      await pushNotificationToUser(a.employeeId, {
        type: "task_deleted",
        message: `Task deleted`,
        taskId: id
      });
    }
    await prisma.task.delete({ where: { id } });
    emitTaskEvent("task_deleted", {
      taskId: id,
      assignedEmployeeIds,
      createdById: task?.createdById,
      actor: { id: user.id, name: user.name, username: user.username, profileImage: (user as any).profileImage || null },
      action: `deleted task: "${task?.title}"`
    });
    res.status(204).send();
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const assignEmployee = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { employeeId } = req.body;
    const user = (req as any).user;
    const a = await prisma.taskAssignment.create({ data: { taskId: id, employeeId } });
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignments: { include: { employee: true } } }
    });
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    await pushNotificationToUser(employeeId, {
      type: "task_assigned",
      message: `You were assigned to: ${task?.title}`,
      task
    });
    emitTaskEvent("task_assigned", { 
      task, 
      assignment: a,
      actor: { id: user.id, name: user.name, username: user.username, profileImage: (user as any).profileImage || null },
      employee: employee,
      action: `assigned ${employee?.name || employee?.username} to task: ${task?.title}`
    });
    res.json(a);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const unassignEmployee = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const assign = await prisma.taskAssignment.findUnique({
      where: { id },
      include: { task: true, employee: true }
    });
    if (!assign) return res.status(404).json({ message: "Not found" });
    await prisma.taskAssignment.update({
      where: { id },
      data: { unassignedAt: new Date() }
    });
    await pushNotificationToUser(assign.employeeId, {
      type: "task_unassigned",
      message: `You were unassigned from: ${assign.task?.title || "a task"}`,
      taskId: assign.taskId
    });
    emitTaskEvent("task_unassigned", { 
      assignmentId: id,
      actor: { id: user.id, name: user.name, username: user.username, profileImage: (user as any).profileImage || null },
      employee: assign.employee,
      task: assign.task,
      action: `unassigned ${assign.employee?.name || assign.employee?.username} from task: ${assign.task?.title}`
    });
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const moveTask = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const { to } = req.body;
    const user = (req as any).user;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: true }
    });
    if (!task) return res.status(404).json({ message: "Not found" });

    if (user.role === "EMPLOYEE") {
      const assigned = task.assignments.some(
        (a) => a.employeeId === user.id && !a.unassignedAt
      );
      if (!assigned) return res.status(403).json({ message: "Forbidden" });
    }

    const from = task.status;
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: to,
        completedAt:
          to === "COMPLETED"
            ? new Date()
            : to === "TODO"
            ? null
            : task.completedAt
      },
      include: {
        assignments: { include: { employee: true } }
      }
    });

    await prisma.taskStatusHistory.create({
      data: { taskId, userId: user.id, fromState: from, toState: to }
    });

    const assignedUsers = task.assignments.map((a) => a.employeeId);
    for (const uid of assignedUsers) {
      await pushNotificationToUser(uid, {
        type: "task_status_changed",
        message: `${task.title} moved ${from} → ${to}`,
        task: updated
      });
    }
    await pushNotificationToUser(task.createdById, {
      type: "task_status_changed",
      message: `${task.title} moved ${from} → ${to}`,
      task: updated
    });

    emitTaskEvent("task_status_changed", { 
      task: updated,
      actor: { id: user.id, name: user.name, username: user.username, profileImage: (user as any).profileImage || null },
      from,
      to,
      action: `moved task "${updated.title}" from ${from} to ${to}`
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
