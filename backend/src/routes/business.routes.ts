import { Router } from "express";
import * as businessController from "../controllers/business.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";
import { createBusinessSchema, deleteActivitySchema } from "../validation/business.schema.js";

const router = Router();

// Setting up businesses is for the system admin only
router.use(authenticate, authorize("SYSTEM_ADMIN"));

router.get("/", businessController.listBusinesses);
router.post("/", validate(createBusinessSchema), auditLog("CREATE", "Business"), businessController.createBusiness);
router.get("/:id/activity", businessController.listActivity);
router.delete("/:id/activity", validate(deleteActivitySchema), businessController.deleteActivity);

export default router;
