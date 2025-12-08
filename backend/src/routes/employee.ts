import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import * as employeeController from "../controllers/employeeController";

const router = Router();
router.use(authMiddleware, requireRole("EMPLOYEE"));

router.get("/:employeeId/board", employeeController.getEmployeeBoard);
router.get("/:employeeId/colleagues", employeeController.getColleagues);

export default router;
