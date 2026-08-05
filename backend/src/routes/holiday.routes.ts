import { Router } from "express";
import * as holidayController from "../controllers/holiday.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";
import { createHolidaySchema, rejectHolidaySchema } from "../validation/holiday.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createHolidaySchema), holidayController.requestHoliday);
router.get("/", holidayController.listHolidayRequests);

router.post(
  "/:id/approve",
  authorize("MANAGER"),
  auditLog("APPROVE", "HolidayRequest"),
  holidayController.approveHoliday,
);

router.post(
  "/:id/reject",
  authorize("MANAGER"),
  validate(rejectHolidaySchema),
  auditLog("REJECT", "HolidayRequest"),
  holidayController.rejectHoliday,
);

router.post("/:id/cancel", holidayController.cancelHoliday);

export default router;
