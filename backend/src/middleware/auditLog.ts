import { RequestHandler } from "express";
import prisma from "../lib/db.js";
import logger from "../lib/logger.js";

export function auditLog(action: string, entity: string): RequestHandler {
  return (req, res, next) => {
    res.on("finish", () => {
      if (req.user && res.statusCode < 400) {
        prisma.auditLog
          .create({
            data: {
              userId: req.user.userId,
              action,
              entity,
              entityId: (req.params.id as string) || undefined,
              details: { method: req.method, path: req.path },
            },
          })
          .catch((err) => logger.error(err, "Failed to write audit log"));
      }
    });
    next();
  };
}
