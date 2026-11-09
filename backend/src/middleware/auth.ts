import { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";
import prisma from "../lib/db.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  let userId: string;
  try {
    userId = verifyAccessToken(header.slice(7)).userId;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Checked against the database on every request so disabled accounts and role changes apply straight away
  prisma.user
    .findUnique({ where: { id: userId }, select: { role: true, businessId: true, active: true } })
    .then((user) => {
      if (!user || !user.active) return next(new UnauthorizedError("Account not found or disabled"));
      req.user = { userId, role: user.role, businessId: user.businessId };
      next();
    })
    .catch(next);
};
