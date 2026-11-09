import { Request, RequestHandler } from "express";
import { Role } from "@prisma/client";
import prisma from "../lib/db.js";
import { ForbiddenError } from "../lib/errors.js";
import type { Store } from "../lib/storeScope.js";

// Assistant managers are employees with a flag, so they're authorised separately from roles
export type Permission = Role | "ASSISTANT_MANAGER";

// Looked up per request rather than stored in the token so promotions/demotions apply immediately
export async function isAssistantManager(req: Request) {
  if (!req.user || req.user.role !== "EMPLOYEE") return false;
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { isAssistantManager: true, active: true },
  });
  return Boolean(user?.active && user.isAssistantManager);
}

// Managers, admins and assistant managers
export async function canManageStaff(req: Request) {
  if (req.user?.role === "MANAGER" || req.user?.role === "SYSTEM_ADMIN") return true;
  return isAssistantManager(req);
}

export function authorize(...permissions: Permission[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new ForbiddenError("You do not have permission to perform this action"));
    if (permissions.includes(req.user.role)) return next();

    if (!permissions.includes("ASSISTANT_MANAGER")) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }
    isAssistantManager(req)
      .then((allowed) => next(allowed ? undefined : new ForbiddenError("You do not have permission to perform this action")))
      .catch(next);
  };
}

// Assistant managers may only act on regular employees in their own business, not themselves or other assistants
export async function assertCanManageUser(req: Request, targetId: string) {
  if (req.user?.role === "MANAGER" || req.user?.role === "SYSTEM_ADMIN") return;

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { role: true, businessId: true, isAssistantManager: true },
  });
  if (
    !target ||
    targetId === req.user?.userId ||
    target.role !== "EMPLOYEE" ||
    target.isAssistantManager ||
    target.businessId !== req.user?.businessId
  ) {
    throw new ForbiddenError("Assistant managers can only manage regular employees");
  }
  await assertUserAtStore(req, targetId);
}

// The store an assistant manager is limited to, or null if they can work across every store
export async function getRestrictedStore(req: Request): Promise<Store | null> {
  if (!req.user || req.user.role !== "EMPLOYEE") return null;
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { isAssistantManager: true, location: { select: { id: true, name: true } } },
  });
  return user?.isAssistantManager ? (user.location ?? null) : null;
}

// Store-based assistant managers may only change shifts at their own store
export async function assertCanEditStore(req: Request, store: string | null) {
  const restricted = await getRestrictedStore(req);
  if (restricted && store !== restricted.name) {
    throw new ForbiddenError(`You can only change shifts at ${restricted.name}`);
  }
}

// Store-based assistant managers may only deal with staff at their own store
export async function assertUserAtStore(req: Request, userId: string) {
  const restricted = await getRestrictedStore(req);
  if (!restricted) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locationId: true } });
  if (user?.locationId !== restricted.id) {
    throw new ForbiddenError(`You can only manage staff at ${restricted.name}`);
  }
}
