import { RequestHandler } from "express";
import * as locationService from "../services/location.service.js";
import { param } from "../lib/params.js";
import { getVisibleStoreIds } from "../middleware/authorize.js";

export const createLocation: RequestHandler = async (req, res, next) => {
  try {
    const location = await locationService.createLocation(req.user!.businessId!, req.body.name);
    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
};

export const listLocations: RequestHandler = async (req, res, next) => {
  try {
    const locations = await locationService.listLocations(req.user!.businessId!);
    const visible = await getVisibleStoreIds(req);
    res.json(visible ? locations.filter((l) => visible.includes(l.id)) : locations);
  } catch (err) {
    next(err);
  }
};

export const updateLocation: RequestHandler = async (req, res, next) => {
  try {
    const location = await locationService.updateLocation(param(req, "id"), req.body.name, req.user!.businessId!);
    res.json(location);
  } catch (err) {
    next(err);
  }
};

export const deleteLocation: RequestHandler = async (req, res, next) => {
  try {
    await locationService.deleteLocation(param(req, "id"), req.user!.businessId!);
    res.json({ message: "Location deleted" });
  } catch (err) {
    next(err);
  }
};
