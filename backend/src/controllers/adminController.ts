import { Request, Response } from "express";
import prisma from "../db/client";
import { hashPassword } from "../utils/passwords";
import { emitTaskEvent } from "../sockets/socket";

/* Create manager */
export const createManager = async (req: Request, res: Response) => {
  try {
    const { username, name, address, dob, password } = req.body;
    if (!username || !name || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        name,
        address,
        dob: dob ? new Date(dob) : null,
        role: "MANAGER",
        hashedPassword: hashed
      }
    });
    // Emit socket event for real-time birthday detection update
    emitTaskEvent("user_created", { user });
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* Create employee */
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { username, name, address, dob, password, managerId } = req.body;
    if (!username || !name || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        name,
        address,
        dob: dob ? new Date(dob) : null,
        role: "EMPLOYEE",
        hashedPassword: hashed,
        managerId: managerId || null
      }
    });
    // Emit socket event for real-time birthday detection update
    emitTaskEvent("user_created", { user });
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const listManagers = async (_req: Request, res: Response) => {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    include: { employees: true }
  });
  res.json(managers);
};

export const listEmployees = async (_req: Request, res: Response) => {
  const employees = await prisma.user.findMany({ where: { role: "EMPLOYEE" } });
  res.json(employees);
};

export const getManagerWithEmployees = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const manager = await prisma.user.findUnique({
    where: { id },
    include: { employees: true }
  });
  if (!manager) return res.status(404).json({ message: "Not found" });
  res.json(manager);
};

export const updateManager = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data: any = req.body;
  if (data.dob) data.dob = new Date(data.dob);
  const updated = await prisma.user.update({ where: { id }, data });
  // Emit socket event for real-time birthday detection update
  emitTaskEvent("user_updated", { user: updated });
  res.json(updated);
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
};

// Company CRUD with carouselImages stored as JSON string
export const getCompany = async (_req: Request, res: Response) => {
  let c = await prisma.company.findFirst();
  if (!c) {
    c = await prisma.company.create({ data: { name: "My Company" } });
  }

  let carousel: string[] = [];
  try {
    if (c.carouselImages) carousel = JSON.parse(c.carouselImages);
  } catch {
    carousel = [];
  }

  res.json({ ...c, carouselImages: carousel });
};

export const updateCompany = async (req: Request, res: Response) => {
  const { name, logo, carouselImages, bannerText } = req.body; // carouselImages expected as array
  let c = await prisma.company.findFirst();

  const carouselString = JSON.stringify(carouselImages || []);

  if (!c) {
    c = await prisma.company.create({
      data: {
        name: name || "My Company",
        logo: logo || null,
        carouselImages: carouselString,
        bannerText: bannerText || "Welcome to our company!"
      }
    });
  } else {
    c = await prisma.company.update({
      where: { id: c.id },
      data: { 
        name, 
        logo, 
        carouselImages: carouselString,
        bannerText: bannerText || c.bannerText
      }
    });
  }

  // Emit real-time update event
  emitTaskEvent("company_updated", {
    company: { ...c, carouselImages },
    bannerText: c.bannerText
  });

  res.json({ ...c, carouselImages });
};

/* NEW: updateUser - admin can update any user (used by AssignTeam & general updates) */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body: any = { ...req.body };

    if (body.password) {
      body.hashedPassword = await hashPassword(body.password);
      delete body.password;
    }
    if (body.dob) body.dob = new Date(body.dob);

    const updated = await prisma.user.update({ where: { id }, data: body });
    // Emit socket event for real-time birthday detection update
    emitTaskEvent("user_updated", { user: updated });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
