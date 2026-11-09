import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createCategorySchema, updateCategorySchema } from "../validation/category.schema.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("OWNER"),
  validate(createCategorySchema),
  categoryController.createCategory,
);

// Categories are for managers to organise staff; employees never see them
router.get("/", authorize("MANAGER", "ASSISTANT_MANAGER"), categoryController.listCategories);

router.patch(
  "/:id",
  authorize("OWNER"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  authorize("OWNER"),
  categoryController.deleteCategory,
);

export default router;
