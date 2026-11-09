import { RequestHandler } from "express";
import * as businessService from "../services/business.service.js";

export const listBusinesses: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await businessService.listBusinesses());
  } catch (err) {
    next(err);
  }
};

export const createBusiness: RequestHandler = async (req, res, next) => {
  try {
    res.status(201).json(await businessService.createBusiness(req.body));
  } catch (err) {
    next(err);
  }
};
