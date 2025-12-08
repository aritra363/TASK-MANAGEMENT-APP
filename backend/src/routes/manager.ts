import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import * as managerController from "../controllers/managerController";

const router = Router();
router.use(authMiddleware, requireRole("MANAGER"));

router.get("/:managerId/boards", managerController.getManagerBoards);
router.get("/:managerId/tasks", managerController.getTasksForManager);
router.get("/:managerId/completed", managerController.getCompletedTasksForManager);
router.get("/:managerId/employees", managerController.getEmployeesOfManager);

export default router;
