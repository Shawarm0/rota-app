import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";
import { createUserSchema, updateUserSchema, changePasswordSchema, resetPasswordSchema } from "../validation/user.schema.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("SYSTEM_ADMIN", "MANAGER"),
  validate(createUserSchema),
  auditLog("CREATE", "User"),
  userController.createUser,
);

router.get("/", authorize("SYSTEM_ADMIN", "MANAGER"), userController.listUsers);

router.get("/:id", userController.getUser);

router.patch(
  "/:id",
  validate(updateUserSchema),
  auditLog("UPDATE", "User"),
  userController.updateUser,
);

router.post(
  "/:id/disable",
  authorize("MANAGER", "SYSTEM_ADMIN"),
  auditLog("DISABLE", "User"),
  userController.disableUser,
);

router.post(
  "/:id/enable",
  authorize("MANAGER", "SYSTEM_ADMIN"),
  auditLog("ENABLE", "User"),
  userController.enableUser,
);

router.post(
  "/:id/reset-password",
  authorize("MANAGER", "SYSTEM_ADMIN"),
  validate(resetPasswordSchema),
  auditLog("RESET_PASSWORD", "User"),
  userController.resetPassword,
);

router.post(
  "/change-password",
  validate(changePasswordSchema),
  userController.changePassword,
);

export default router;
