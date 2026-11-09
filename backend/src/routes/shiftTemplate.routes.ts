import { Router } from "express";
import * as templateController from "../controllers/shiftTemplate.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { shiftTemplateSchema } from "../validation/shiftTemplate.schema.js";

const router = Router();

router.use(authenticate);

// Anyone who edits shifts can use templates; only the owner and store managers create them
router.get("/", authorize("MANAGER", "ASSISTANT_MANAGER"), templateController.listTemplates);
router.post("/", authorize("MANAGER"), validate(shiftTemplateSchema), templateController.createTemplate);
router.put("/:id", authorize("MANAGER"), validate(shiftTemplateSchema), templateController.updateTemplate);
router.delete("/:id", authorize("MANAGER"), templateController.deleteTemplate);

export default router;
