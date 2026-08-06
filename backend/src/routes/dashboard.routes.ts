import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.use(authenticate, authorize("MANAGER", "SYSTEM_ADMIN"));

router.get("/", dashboardController.getDashboard);
router.get("/shifts-to-cover", dashboardController.getShiftsToCover);
router.get("/staffing", dashboardController.getStaffing);
router.get("/employees", dashboardController.getEmployeeSummaries);
router.get("/reports/hours", dashboardController.getHoursReport);
router.get("/reports/export", dashboardController.exportCSV);

export default router;
