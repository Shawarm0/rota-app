import { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/db.js";
import logger from "../lib/logger.js";

export function writeAuditLog(data: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
}) {
  prisma.auditLog
    .create({ data })
    .catch((err) => logger.error(err, "Failed to write audit log"));
}

export function auditLog(action: string, entity: string): RequestHandler {
  return (req, res, next) => {
    res.on("finish", () => {
      if (req.user && res.statusCode < 400) {
        writeAuditLog({
          userId: req.user.userId,
          action,
          entity,
          entityId: (req.params.id as string) || undefined,
          details: { method: req.method, path: req.path },
        });
      }
    });
    next();
  };
}
