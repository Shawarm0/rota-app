import { RequestHandler } from "express";
import * as holidayService from "../services/holiday.service.js";
import { param } from "../lib/params.js";

export const requestHoliday: RequestHandler = async (req, res, next) => {
  try {
    const result = await holidayService.requestHoliday(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const listHolidayRequests: RequestHandler = async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    if (req.user!.role === "MANAGER" || req.user!.role === "SYSTEM_ADMIN") {
      const requests = await holidayService.listHolidayRequests(req.user!.businessId!, status);
      res.json(requests);
    } else {
      const requests = await holidayService.getMyHolidayRequests(req.user!.userId);
      res.json(requests);
    }
  } catch (err) {
    next(err);
  }
};

export const approveHoliday: RequestHandler = async (req, res, next) => {
  try {
    const result = await holidayService.approveHoliday(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const rejectHoliday: RequestHandler = async (req, res, next) => {
  try {
    const result = await holidayService.rejectHoliday(param(req, "id"), req.body.reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const cancelHoliday: RequestHandler = async (req, res, next) => {
  try {
    const result = await holidayService.cancelHoliday(param(req, "id"), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
