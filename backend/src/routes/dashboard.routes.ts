import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

const managers = authorize("MANAGER", "SYSTEM_ADMIN");
const managersAndAssistants = authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER");

router.use(authenticate);

router.get("/", managers, dashboardController.getDashboard);
router.get("/shifts-to-cover", managersAndAssistants, dashboardController.getShiftsToCover);
router.get("/staffing", managers, dashboardController.getStaffing);
router.get("/employees", managers, dashboardController.getEmployeeSummaries);
router.get("/reports/hours", managersAndAssistants, dashboardController.getHoursReport);
router.get("/reports/export", managersAndAssistants, dashboardController.exportCSV);

export default router;
