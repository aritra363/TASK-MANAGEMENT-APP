import { Request, Response } from "express";
import prisma from "../db/client";
import { comparePassword } from "../utils/passwords";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, remember } = req.body;
    const user = await prisma.user.findUnique({ where: { username }});
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await comparePassword(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    const cookieOptions: any = { httpOnly: true, sameSite: "lax" };

    if (user.role === "ADMIN") {
      // session cookie only
    } else {
      if (remember) cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    res.cookie("token", token, cookieOptions);
    res.json({ message: "ok", user: { id: user.id, role: user.role, name: user.name }});
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "logged out" });
};

export const me = async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
