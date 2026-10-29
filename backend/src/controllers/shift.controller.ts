import { RequestHandler } from "express";
import * as shiftService from "../services/shift.service.js";
import { param } from "../lib/params.js";
import { writeAuditLog } from "../middleware/auditLog.js";

export const createShift: RequestHandler = async (req, res, next) => {
  try {
    const shift = await shiftService.createShift(param(req, "rotaId"), req.body);
    res.status(201).json(shift);
  } catch (err) {
    next(err);
  }
};

export const updateShift: RequestHandler = async (req, res, next) => {
  try {
    const before = await shiftService.getShiftSnapshot(param(req, "id"));
    const shift = await shiftService.updateShift(param(req, "id"), req.body);
    writeAuditLog({
      userId: req.user!.userId,
      action: "EDIT_SHIFT",
      entity: "Shift",
      entityId: shift.id,
      details: { before, after: await shiftService.getShiftSnapshot(shift.id) },
    });
    res.json(shift);
  } catch (err) {
    next(err);
  }
};

export const deleteShift: RequestHandler = async (req, res, next) => {
  try {
    const shift = await shiftService.getShiftSnapshot(param(req, "id"));
    await shiftService.deleteShift(param(req, "id"));
    writeAuditLog({
      userId: req.user!.userId,
      action: "DELETE_SHIFT",
      entity: "Shift",
      entityId: param(req, "id"),
      details: shift,
    });
    res.json({ message: "Shift deleted" });
  } catch (err) {
    next(err);
  }
};

export const bulkCreateShifts: RequestHandler = async (req, res, next) => {
  try {
    const result = await shiftService.bulkCreateShifts(param(req, "rotaId"), req.body.shifts);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyShifts: RequestHandler = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const shifts = await shiftService.getShiftsForUser(
      req.user!.userId,
      from as string | undefined,
      to as string | undefined,
    );
    res.json(shifts);
  } catch (err) {
    next(err);
  }
};

export const getAllShifts: RequestHandler = async (req, res, next) => {
  try {
    const { from, to, location } = req.query;
    const shifts = await shiftService.getAllShifts(
      req.user!.businessId!,
      from as string | undefined,
      to as string | undefined,
      location as string | undefined,
    );
    res.json(shifts);
  } catch (err) {
    next(err);
  }
};

export const getAvailableShifts: RequestHandler = async (req, res, next) => {
  try {
    const shifts = await shiftService.getAvailableShifts(req.user!.businessId!, req.user!.userId);
    res.json(shifts);
  } catch (err) {
    next(err);
  }
};

export const requestCover: RequestHandler = async (req, res, next) => {
  try {
    const result = await shiftService.requestCover(param(req, "id"));
    writeAuditLog({
      userId: req.user!.userId,
      action: "REQUEST_COVER",
      entity: "Shift",
      entityId: param(req, "id"),
      details: { ...(await shiftService.getShiftSnapshot(param(req, "id"))), notified: result.notified },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const syncShifts: RequestHandler = async (req, res, next) => {
  try {
    const shifts = await shiftService.syncShifts(param(req, "rotaId"), req.body.shifts);
    res.json(shifts);
  } catch (err) {
    next(err);
  }
};

export const createAdditionalShift: RequestHandler = async (req, res, next) => {
  try {
    const shift = await shiftService.createAdditionalShift(req.user!.businessId!, req.body);
    writeAuditLog({
      userId: req.user!.userId,
      action: "ADD_ADDITIONAL",
      entity: "Shift",
      entityId: shift.id,
      details: {
        assignee: shift.user ? `${shift.user.firstName} ${shift.user.lastName}` : null,
        date: shift.date.toISOString().split("T")[0],
        startTime: shift.startTime,
        endTime: shift.endTime,
        location: shift.location,
      },
    });
    res.status(201).json(shift);
  } catch (err) {
    next(err);
  }
};

export const claimShift: RequestHandler = async (req, res, next) => {
  try {
    const shift = await shiftService.claimShift(param(req, "id"), req.user!.userId);
    res.json(shift);
  } catch (err) {
    next(err);
  }
};
