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
  authorize("MANAGER"),
  validate(createCategorySchema),
  categoryController.createCategory,
);

router.get("/", categoryController.listCategories);

router.patch(
  "/:id",
  authorize("MANAGER"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  authorize("MANAGER"),
  categoryController.deleteCategory,
);

export default router;
