import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { subscribeSchema, unsubscribeSchema } from "../validation/push.schema.js";

const router = Router();

router.use(authenticate);

router.get("/push/public-key", notificationController.getPushPublicKey);
router.post("/push/subscribe", validate(subscribeSchema), notificationController.subscribePush);
router.post("/push/unsubscribe", validate(unsubscribeSchema), notificationController.unsubscribePush);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.post("/:id/read", notificationController.markRead);
router.post("/read-all", notificationController.markAllRead);

export default router;
