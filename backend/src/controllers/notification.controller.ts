import { RequestHandler } from "express";
import * as notificationService from "../services/notification.service.js";
import * as pushService from "../services/push.service.js";
import { param } from "../lib/params.js";

export const getNotifications: RequestHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await notificationService.getNotifications(req.user!.userId, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount: RequestHandler = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

export const markRead: RequestHandler = async (req, res, next) => {
  try {
    await notificationService.markRead(param(req, "id"), req.user!.userId);
    res.json({ message: "Marked as read" });
  } catch (err) {
    next(err);
  }
};

export const markAllRead: RequestHandler = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user!.userId);
    res.json({ message: "All marked as read" });
  } catch (err) {
    next(err);
  }
};

export const getPushPublicKey: RequestHandler = (_req, res) => {
  res.json({ publicKey: pushService.getPublicKey() });
};

export const subscribePush: RequestHandler = async (req, res, next) => {
  try {
    await pushService.subscribe(req.user!.userId, req.body);
    res.status(201).json({ message: "Subscribed" });
  } catch (err) {
    next(err);
  }
};

export const unsubscribePush: RequestHandler = async (req, res, next) => {
  try {
    await pushService.unsubscribe(req.user!.userId, req.body.endpoint);
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    next(err);
  }
};
