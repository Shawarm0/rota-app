import { Router } from "express";
import * as holidayController from "../controllers/holiday.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";
import { createHolidaySchema, updateHolidaySchema, rejectHolidaySchema } from "../validation/holiday.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createHolidaySchema), holidayController.requestHoliday);
router.get("/", holidayController.listHolidayRequests);
router.get("/approved", holidayController.getApprovedHolidays);

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

router.patch(
  "/:id",
  authorize("MANAGER"),
  validate(updateHolidaySchema),
  auditLog("UPDATE", "HolidayRequest"),
  holidayController.updateHoliday,
);

router.delete(
  "/:id",
  authorize("MANAGER"),
  auditLog("DELETE", "HolidayRequest"),
  holidayController.deleteHoliday,
);

router.post("/:id/cancel", holidayController.cancelHoliday);

export default router;
