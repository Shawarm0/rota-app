import { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role as any,
      businessId: payload.businessId,
    };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
};
