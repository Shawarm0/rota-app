import { Router } from "express";
import * as shiftController from "../controllers/shift.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateShiftSchema } from "../validation/shift.schema.js";

const router = Router();

router.use(authenticate);

router.get("/mine", shiftController.getMyShifts);
router.get("/available", shiftController.getAvailableShifts);
router.patch("/:id", validate(updateShiftSchema), shiftController.updateShift);
router.delete("/:id", shiftController.deleteShift);
router.post("/:id/claim", shiftController.claimShift);

export default router;
