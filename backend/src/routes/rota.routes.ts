import { Router } from "express";
import * as rotaController from "../controllers/rota.controller.js";
import * as shiftController from "../controllers/shift.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";
import { createRotaSchema, updateRotaSchema, copyRotaSchema } from "../validation/rota.schema.js";
import { createShiftSchema, updateShiftSchema, bulkCreateShiftsSchema } from "../validation/shift.schema.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("MANAGER"),
  validate(createRotaSchema),
  auditLog("CREATE", "Rota"),
  rotaController.createRota,
);

router.get("/", rotaController.listRotas);

router.get("/:id", rotaController.getRota);

router.patch(
  "/:id",
  authorize("MANAGER"),
  validate(updateRotaSchema),
  auditLog("UPDATE", "Rota"),
  rotaController.updateRota,
);

router.delete(
  "/:id",
  authorize("MANAGER"),
  auditLog("DELETE", "Rota"),
  rotaController.deleteRota,
);

router.post(
  "/:id/publish",
  authorize("MANAGER"),
  auditLog("PUBLISH", "Rota"),
  rotaController.publishRota,
);

router.post(
  "/:id/copy",
  authorize("MANAGER"),
  validate(copyRotaSchema),
  auditLog("COPY", "Rota"),
  rotaController.copyRota,
);

router.post(
  "/:rotaId/shifts",
  authorize("MANAGER"),
  validate(createShiftSchema),
  shiftController.createShift,
);

router.post(
  "/:rotaId/shifts/bulk",
  authorize("MANAGER"),
  validate(bulkCreateShiftsSchema),
  shiftController.bulkCreateShifts,
);

export default router;
