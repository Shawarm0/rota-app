import { RequestHandler } from "express";
import * as templateService from "../services/shiftTemplate.service.js";
import { param } from "../lib/params.js";
import { getVisibleStoreIds } from "../middleware/authorize.js";
import { assertCanUseStore } from "../middleware/rotaAccess.js";

// Store checks use assertCanUseStore: the owner can make templates for every store (no store) or one
// store; store managers only for stores they can edit

export const listTemplates: RequestHandler = async (req, res, next) => {
  try {
    res.json(await templateService.listTemplates(req.user!.businessId!, await getVisibleStoreIds(req)));
  } catch (err) {
    next(err);
  }
};

export const createTemplate: RequestHandler = async (req, res, next) => {
  try {
    await assertCanUseStore(req, req.body.locationId);
    res.status(201).json(await templateService.createTemplate(req.user!.businessId!, req.body));
  } catch (err) {
    next(err);
  }
};

export const updateTemplate: RequestHandler = async (req, res, next) => {
  try {
    await assertCanUseStore(req, await templateService.getTemplateStoreId(param(req, "id"), req.user!.businessId!));
    await assertCanUseStore(req, req.body.locationId);
    res.json(await templateService.updateTemplate(param(req, "id"), req.body));
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate: RequestHandler = async (req, res, next) => {
  try {
    await assertCanUseStore(req, await templateService.getTemplateStoreId(param(req, "id"), req.user!.businessId!));
    await templateService.deleteTemplate(param(req, "id"));
    res.json({ message: "Shift template deleted" });
  } catch (err) {
    next(err);
  }
};
