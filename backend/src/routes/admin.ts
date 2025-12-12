import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { authMiddleware, requireRole } from "../middleware/auth";
import { upload } from "../middleware/upload";
import prisma from "../db/client";
import fs from "fs";
import path from "path";

const router = Router();

// Company endpoints are accessible to all authenticated users
router.get("/company", authMiddleware, adminController.getCompany);
router.put("/company", authMiddleware, requireRole("ADMIN"), adminController.updateCompany);

// Get managers and employees for birthday banner - accessible to all authenticated users
router.get("/managers", authMiddleware, adminController.listManagers);
router.get("/employees", authMiddleware, adminController.listEmployees);

// All other admin routes require authenticated ADMIN
router.use(authMiddleware, requireRole("ADMIN"));

// Manager & employee CRUD
router.post("/managers", adminController.createManager);
router.put("/managers/:id", adminController.updateManager);
router.delete("/users/:id", adminController.deleteUser);

router.post("/employees", adminController.createEmployee);

// Manager with employees
router.get("/managers/:id", adminController.getManagerWithEmployees);

// Update any user (used by AssignTeam)
router.put("/users/:id", adminController.updateUser);

// Upload company logo (single)
router.post("/upload/logo", upload.single("logo"), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const url = `/uploads/company/${file.filename}`;
    let c = await prisma.company.findFirst();

    if (!c) {
      c = await prisma.company.create({
        data: {
          name: "My Company",
          logo: url,
          carouselImages: "[]"
        }
      });
    } else {
      c = await prisma.company.update({
        where: { id: c.id },
        data: { logo: url }
      });
    }

    let carousel: string[] = [];
    try {
      if (c.carouselImages) carousel = JSON.parse(c.carouselImages);
    } catch {
      carousel = [];
    }

    res.json({ ...c, carouselImages: carousel });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Upload carousel images (multiple)
router.post("/upload/carousel", upload.array("images", 6), async (req: any, res) => {
  try {
    const files = req.files;
    if (!files || !files.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const urls = files.map((f: any) => `/uploads/carousel/${f.filename}`);

    let c = await prisma.company.findFirst();
    if (!c) {
      c = await prisma.company.create({
        data: {
          name: "My Company",
          logo: null,
          carouselImages: JSON.stringify(urls)
        }
      });
    } else {
      let existing: string[] = [];
      try {
        if (c.carouselImages) existing = JSON.parse(c.carouselImages);
      } catch {
        existing = [];
      }
      const merged = [...existing, ...urls];
      c = await prisma.company.update({
        where: { id: c.id },
        data: { carouselImages: JSON.stringify(merged) }
      });
    }

    let finalArray: string[] = [];
    try {
      finalArray = JSON.parse(c.carouselImages);
    } catch {
      finalArray = [];
    }

    res.json({ ...c, carouselImages: finalArray });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Upload profile image for a user - max 5MB
router.post("/upload/profile/:userId", upload.single("profile"), async (req: any, res) => {
  try {
    const file = req.file;
    const userId = Number(req.params.userId);
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    if (file.size > 5 * 1024 * 1024) {
      // delete file and return error
      try {
        fs.unlinkSync(
          path.join(__dirname, "..", "..", "uploads", "profiles", file.filename)
        );
      } catch (e) {}
      return res.status(400).json({ message: "Profile image too large (max 5MB)" });
    }

    const url = `/uploads/profiles/${file.filename}`;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: url }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Delete carousel image
router.delete("/carousel/:imagePath", async (req: any, res) => {
  try {
    const imagePath = decodeURIComponent(req.params.imagePath);

    // Get current company
    let c = await prisma.company.findFirst();
    if (!c) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Parse carousel images
    let carousel: string[] = [];
    try {
      if (c.carouselImages) carousel = JSON.parse(c.carouselImages);
    } catch {
      carousel = [];
    }

    // Remove the image from array
    const filtered = carousel.filter((img: string) => img !== imagePath);

    // Update database
    c = await prisma.company.update({
      where: { id: c.id },
      data: { carouselImages: JSON.stringify(filtered) }
    });

    // Delete file from disk
    try {
      const filename = imagePath.split("/").pop();
      const filepath = path.join(__dirname, "..", "..", "uploads", "carousel", filename || "");
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (e) {
      // File already deleted or doesn't exist, continue
    }

    // Parse and return
    let finalArray: string[] = [];
    try {
      finalArray = JSON.parse(c.carouselImages);
    } catch {
      finalArray = [];
    }

    res.json({ ...c, carouselImages: finalArray });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
