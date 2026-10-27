import { Request, RequestHandler } from "express";
import * as holidayService from "../services/holiday.service.js";
import { param } from "../lib/params.js";
import { canManageStaff, isAssistantManager } from "../middleware/authorize.js";
import { ForbiddenError } from "../lib/errors.js";

async function assertNotOwnRequest(req: Request) {
  if (!(await isAssistantManager(req))) return;
  if ((await holidayService.getRequestOwnerId(param(req, "id"))) === req.user!.userId) {
    throw new ForbiddenError("You can't approve or reject your own holiday request");
  }
}

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
    if (await canManageStaff(req)) {
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
    await assertNotOwnRequest(req);
    const result = await holidayService.approveHoliday(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const rejectHoliday: RequestHandler = async (req, res, next) => {
  try {
    await assertNotOwnRequest(req);
    const result = await holidayService.rejectHoliday(param(req, "id"), req.body.reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getApprovedHolidays: RequestHandler = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (req.user!.businessId && (await canManageStaff(req))) {
      const holidays = await holidayService.getBusinessHolidays(
        req.user!.businessId,
        from as string | undefined,
        to as string | undefined,
      );
      res.json(holidays);
    } else {
      const holidays = await holidayService.getApprovedHolidays(
        req.user!.userId,
        from as string | undefined,
        to as string | undefined,
      );
      res.json(holidays);
    }
  } catch (err) {
    next(err);
  }
};

export const updateHoliday: RequestHandler = async (req, res, next) => {
  try {
    const result = await holidayService.updateHoliday(param(req, "id"), req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteHoliday: RequestHandler = async (req, res, next) => {
  try {
    await holidayService.deleteHoliday(param(req, "id"));
    res.json({ message: "Holiday request deleted" });
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
