import { RequestHandler } from "express";
import * as locationService from "../services/location.service.js";
import { param } from "../lib/params.js";

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
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

export const updateLocation: RequestHandler = async (req, res, next) => {
  try {
    const location = await locationService.updateLocation(param(req, "id"), req.body.name);
    res.json(location);
  } catch (err) {
    next(err);
  }
};

export const deleteLocation: RequestHandler = async (req, res, next) => {
  try {
    await locationService.deleteLocation(param(req, "id"));
    res.json({ message: "Location deleted" });
  } catch (err) {
    next(err);
  }
};
