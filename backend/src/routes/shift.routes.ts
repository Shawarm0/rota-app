import { Router } from "express";
import * as shiftController from "../controllers/shift.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { updateShiftSchema } from "../validation/shift.schema.js";

const router = Router();

router.use(authenticate);

router.get("/mine", shiftController.getMyShifts);
router.get("/all", authorize("MANAGER", "SYSTEM_ADMIN"), shiftController.getAllShifts);
router.get("/available", shiftController.getAvailableShifts);
router.patch("/:id", validate(updateShiftSchema), shiftController.updateShift);
router.delete("/:id", shiftController.deleteShift);
router.post("/:id/claim", shiftController.claimShift);
router.post("/:id/request-cover", authorize("MANAGER", "SYSTEM_ADMIN"), shiftController.requestCover);

export default router;
