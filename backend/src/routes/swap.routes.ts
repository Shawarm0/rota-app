import { Router } from "express";
import * as swapController from "../controllers/swap.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";
import { createSwapSchema } from "../validation/swap.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createSwapSchema), swapController.requestSwap);
router.get("/", swapController.listSwapRequests);
router.post("/:id/accept", swapController.acceptSwap);

router.post(
  "/:id/approve",
  authorize("MANAGER"),
  auditLog("APPROVE", "SwapRequest"),
  swapController.approveSwap,
);

router.post(
  "/:id/reject",
  authorize("MANAGER"),
  auditLog("REJECT", "SwapRequest"),
  swapController.rejectSwap,
);

router.post("/:id/cancel", swapController.cancelSwap);

export default router;
