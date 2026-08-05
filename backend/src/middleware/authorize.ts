import { RequestHandler } from "express";
import { Role } from "@prisma/client";
import { ForbiddenError } from "../lib/errors.js";

export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError("You do not have permission to perform this action");
    }
    next();
  };
}
