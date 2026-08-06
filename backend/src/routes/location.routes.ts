import { Router } from "express";
import * as locationController from "../controllers/location.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createLocationSchema, updateLocationSchema } from "../validation/location.schema.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("MANAGER"),
  validate(createLocationSchema),
  locationController.createLocation,
);

router.get("/", locationController.listLocations);

router.patch(
  "/:id",
  authorize("MANAGER"),
  validate(updateLocationSchema),
  locationController.updateLocation,
);

router.delete(
  "/:id",
  authorize("MANAGER"),
  locationController.deleteLocation,
);

export default router;
