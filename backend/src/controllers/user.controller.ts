import { RequestHandler } from "express";
import * as userService from "../services/user.service.js";
import { param } from "../lib/params.js";

export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user!.role, req.user!.businessId);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const role = req.query.role as string | undefined;
    const locationId = req.query.locationId as string | undefined;
    const users = await userService.listUsers(
      req.user!.role === "SYSTEM_ADMIN" ? null : req.user!.businessId,
      role as any,
      locationId,
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.getUser(param(req, "id"));
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.updateUser(param(req, "id"), req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const disableUser: RequestHandler = async (req, res, next) => {
  try {
    const result = await userService.disableUser(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const enableUser: RequestHandler = async (req, res, next) => {
  try {
    const result = await userService.enableUser(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    await userService.resetPassword(param(req, "id"), req.body.newPassword);
    res.json({ message: "Password reset" });
  } catch (err) {
    next(err);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    await userService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    res.json({ message: "Password changed" });
  } catch (err) {
    next(err);
  }
};
