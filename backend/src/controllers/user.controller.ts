import { RequestHandler } from "express";
import { Role } from "@prisma/client";
import * as userService from "../services/user.service.js";
import { param } from "../lib/params.js";
import { assertCanManageUser, canManageStaff, getAccess, getVisibleStoreIds } from "../middleware/authorize.js";
import { ForbiddenError } from "../lib/errors.js";

export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const access = await getAccess(req);
    if (access.editableStores !== null) {
      // Store managers and store-based assistant managers add staff to their own stores
      req.body.locationId ??= access.homeStore?.id;
      if (!access.editableStores.some((s) => s.id === req.body.locationId)) {
        throw new ForbiddenError("You can only add staff to stores you manage");
      }
    }
    const user = await userService.createUser(req.body, req.user!.role, req.user!.businessId);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    // ?role=EMPLOYEE,MANAGER
    const roles = (req.query.role as string | undefined)?.split(",").filter(Boolean) as Role[] | undefined;
    // Store-based assistant managers only see staff at their own store
    const visible = await getVisibleStoreIds(req);
    const requested = req.query.locationId as string | undefined;
    const locationIds = requested ? (visible && !visible.includes(requested) ? [] : [requested]) : visible;
    const users = await userService.listUsers(
      req.user!.role === "SYSTEM_ADMIN" ? null : req.user!.businessId,
      roles,
      locationIds,
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.getUser(param(req, "id"));
    const isSelf = user.id === req.user!.userId;
    if (!isSelf && (req.user!.role !== "SYSTEM_ADMIN" && (user.businessId !== req.user!.businessId || !(await canManageStaff(req))))) {
      throw new ForbiddenError("You can't view this person");
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    await assertCanManageUser(req, param(req, "id"));
    const access = await getAccess(req);
    const isOwner = access.role === "OWNER" || access.role === "SYSTEM_ADMIN";
    if ((req.body.role !== undefined || req.body.extraStoreIds !== undefined) && !isOwner) {
      throw new ForbiddenError("Only the owner can change store managers");
    }
    if (req.body.isAssistantManager !== undefined && !isOwner && access.role !== "MANAGER") {
      throw new ForbiddenError("Only managers can assign assistant managers");
    }
    if (
      req.body.locationId !== undefined &&
      access.editableStores !== null &&
      !access.editableStores.some((s) => s.id === req.body.locationId)
    ) {
      throw new ForbiddenError("You can only move staff to stores you manage");
    }
    const user = await userService.updateUser(param(req, "id"), req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const disableUser: RequestHandler = async (req, res, next) => {
  try {
    await assertCanManageUser(req, param(req, "id"));
    const result = await userService.disableUser(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const enableUser: RequestHandler = async (req, res, next) => {
  try {
    await assertCanManageUser(req, param(req, "id"));
    const result = await userService.enableUser(param(req, "id"));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    await assertCanManageUser(req, param(req, "id"));
    await userService.resetPassword(param(req, "id"), req.body.newPassword);
    res.json({ message: "Password reset" });
  } catch (err) {
    next(err);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    await userService.deleteUser(param(req, "id"), req.user!.role);
    res.json({ message: "User deleted" });
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
