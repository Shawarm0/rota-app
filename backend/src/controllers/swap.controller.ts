import { RequestHandler } from "express";
import * as swapService from "../services/swap.service.js";
import { param } from "../lib/params.js";

export const requestSwap: RequestHandler = async (req, res, next) => {
  try {
    const result = await swapService.requestSwap(req.user!.userId, req.body.shiftId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const listSwapRequests: RequestHandler = async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const requests = await swapService.listSwapRequests(req.user!.businessId!, status);
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

export const acceptSwap: RequestHandler = async (req, res, next) => {
  try {
    const result = await swapService.acceptSwap(param(req, "id"), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const approveSwap: RequestHandler = async (req, res, next) => {
  try {
    const result = await swapService.approveSwap(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const rejectSwap: RequestHandler = async (req, res, next) => {
  try {
    const result = await swapService.rejectSwap(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const cancelSwap: RequestHandler = async (req, res, next) => {
  try {
    const result = await swapService.cancelSwap(param(req, "id"), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
