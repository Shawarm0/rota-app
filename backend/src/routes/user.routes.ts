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
  authorize("SYSTEM_ADMIN", "MANAGER", "ASSISTANT_MANAGER"),
  validate(createUserSchema),
  auditLog("CREATE", "User"),
  userController.createUser,
);

router.get("/", authorize("SYSTEM_ADMIN", "MANAGER", "ASSISTANT_MANAGER"), userController.listUsers);

router.get("/:id", userController.getUser);

router.patch(
  "/:id",
  authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"),
  validate(updateUserSchema),
  auditLog("UPDATE", "User"),
  userController.updateUser,
);

router.post(
  "/:id/disable",
  authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"),
  auditLog("DISABLE", "User"),
  userController.disableUser,
);

router.post(
  "/:id/enable",
  authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"),
  auditLog("ENABLE", "User"),
  userController.enableUser,
);

router.delete(
  "/:id",
  authorize("SYSTEM_ADMIN"),
  auditLog("DELETE", "User"),
  userController.deleteUser,
);

router.post(
  "/:id/reset-password",
  authorize("MANAGER", "SYSTEM_ADMIN", "ASSISTANT_MANAGER"),
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
