import { Router } from "express";
import * as taskController from "../controllers/taskController";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// More specific routes first
router.post("/:id/assign", requireRole(["MANAGER"]), taskController.assignEmployee);
router.post("/assignment/:id/unassign", requireRole(["MANAGER"]), taskController.unassignEmployee);
router.post("/:id/move", taskController.moveTask);

// List tasks for manager (for Add Task page)
router.get("/", requireRole(["MANAGER"]), taskController.listTasksForManager);

router.post("/", requireRole(["MANAGER"]), taskController.createTask);
router.put("/:id", requireRole(["MANAGER"]), taskController.updateTask);
router.delete("/:id", requireRole(["MANAGER"]), taskController.deleteTask);

export default router;
