import { Router } from "express";
import * as shiftController from "../controllers/shift.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { updateShiftSchema } from "../validation/shift.schema.js";

const router = Router();

router.use(authenticate);

router.get("/mine", shiftController.getMyShifts);
router.get("/all", authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"), shiftController.getAllShifts);
router.get("/available", shiftController.getAvailableShifts);
router.post("/additional", authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"), shiftController.createAdditionalShift);
router.patch("/:id", authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"), validate(updateShiftSchema), shiftController.updateShift);
router.delete("/:id", authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"), shiftController.deleteShift);
router.post("/:id/claim", shiftController.claimShift);
router.post("/:id/request-cover", authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"), shiftController.requestCover);

export default router;
