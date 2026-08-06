import { RequestHandler } from "express";
import * as shiftService from "../services/shift.service.js";
import { param } from "../lib/params.js";

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
    const shift = await shiftService.updateShift(param(req, "id"), req.body);
    res.json(shift);
  } catch (err) {
    next(err);
  }
};

export const deleteShift: RequestHandler = async (req, res, next) => {
  try {
    await shiftService.deleteShift(param(req, "id"));
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
    const { from, to } = req.query;
    const shifts = await shiftService.getAllShifts(
      req.user!.businessId!,
      from as string | undefined,
      to as string | undefined,
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

export const claimShift: RequestHandler = async (req, res, next) => {
  try {
    const shift = await shiftService.claimShift(param(req, "id"), req.user!.userId);
    res.json(shift);
  } catch (err) {
    next(err);
  }
};
