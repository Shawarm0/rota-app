import { Request, RequestHandler } from "express";
import { Role } from "@prisma/client";
import prisma from "../lib/db.js";
import { ForbiddenError } from "../lib/errors.js";
import type { Store } from "../lib/storeScope.js";

// Assistant managers are employees with a flag, so they're authorised separately from roles
export type Permission = Role | "ASSISTANT_MANAGER";

export interface Access {
  role: Role;
  isAssistantManager: boolean;
  homeStore: Store | null;
  // Stores this person may change; null means every store
  editableStores: Store[] | null;
  // Stores whose team data this person may see; null means every store
  visibleStores: Store[] | null;
}

const accessCache = new WeakMap<Request, Promise<Access>>();

async function loadAccess(req: Request): Promise<Access> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      role: true,
      isAssistantManager: true,
      location: { select: { id: true, name: true } },
      storeAccess: { select: { location: { select: { id: true, name: true } } } },
    },
  });
  const role = user?.role ?? req.user!.role;
  const homeStore = user?.location ?? null;
  const isAssistantManager = role === "EMPLOYEE" && Boolean(user?.isAssistantManager);

  if (role === "SYSTEM_ADMIN" || role === "OWNER") {
    return { role, isAssistantManager, homeStore, editableStores: null, visibleStores: null };
  }
  if (role === "MANAGER") {
    // Store managers run their own store (plus any the owner has granted) and can view the rest
    const extra = user?.storeAccess.map((a) => a.location) ?? [];
    const editable = [...(homeStore ? [homeStore] : []), ...extra.filter((s) => s.id !== homeStore?.id)];
    return { role, isAssistantManager, homeStore, editableStores: editable, visibleStores: null };
  }
  if (isAssistantManager) {
    // Store-based assistant managers only see and change their own store; without a store they cover all
    const stores = homeStore ? [homeStore] : null;
    return { role, isAssistantManager, homeStore, editableStores: stores, visibleStores: stores };
  }
  return { role, isAssistantManager, homeStore, editableStores: [], visibleStores: [] };
}

// Looked up once per request rather than stored in the token, so changes apply immediately
export function getAccess(req: Request) {
  let access = accessCache.get(req);
  if (!access) {
    access = loadAccess(req);
    accessCache.set(req, access);
  }
  return access;
}

export async function isAssistantManager(req: Request) {
  return (await getAccess(req)).isAssistantManager;
}

// Owner, store managers, admins and assistant managers
export async function canManageStaff(req: Request) {
  const access = await getAccess(req);
  return access.role !== "EMPLOYEE" || access.isAssistantManager;
}

export function canEditStoreName(access: Access, store: string | null) {
  if (access.editableStores === null) return true;
  return store !== null && access.editableStores.some((s) => s.name === store);
}

export function authorize(...permissions: Permission[]): RequestHandler {
  return (req, _res, next) => {
    const denied = new ForbiddenError("You do not have permission to perform this action");
    if (!req.user) return next(denied);
    // The owner can do anything a manager can (but not system-admin-only actions)
    if (permissions.includes(req.user.role) || (req.user.role === "OWNER" && permissions.includes("MANAGER"))) return next();
    if (!permissions.includes("ASSISTANT_MANAGER")) return next(denied);
    isAssistantManager(req)
      .then((allowed) => next(allowed ? undefined : denied))
      .catch(next);
  };
}

// Only shifts at stores this person may change
export async function assertCanEditStore(req: Request, store: string | null) {
  const access = await getAccess(req);
  if (!canEditStoreName(access, store)) {
    const names = access.editableStores?.map((s) => s.name).join(" or ");
    throw new ForbiddenError(names ? `You can only change shifts at ${names}` : "You can't change shifts at this store");
  }
}

// Only staff at stores this person may change
export async function assertUserAtStore(req: Request, userId: string) {
  const access = await getAccess(req);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locationId: true, businessId: true } });
  if (!user || (req.user!.role !== "SYSTEM_ADMIN" && user.businessId !== req.user!.businessId)) {
    throw new ForbiddenError("You can't manage this person");
  }
  if (access.editableStores === null) return;
  if (!access.editableStores.some((s) => s.id === user.locationId)) {
    const names = access.editableStores.map((s) => s.name).join(" or ");
    throw new ForbiddenError(names ? `You can only manage staff at ${names}` : "You can't manage staff at this store");
  }
}

interface ManageTarget {
  id: string;
  role: Role;
  businessId: string | null;
  isAssistantManager: boolean;
  locationId: string | null;
}

// Who can manage whom: the owner manages everyone in the business, store managers manage the staff
// at their stores, and assistant managers manage regular employees at theirs. Nobody below the owner
// can act on themselves (e.g. approve their own leave).
export function canManageTarget(access: Access, actor: { userId: string; businessId: string | null }, target: ManageTarget) {
  if (access.role === "SYSTEM_ADMIN") return true;
  if (target.businessId !== actor.businessId || target.role === "SYSTEM_ADMIN") return false;
  if (access.role === "OWNER") return true;
  if (target.id === actor.userId || target.role !== "EMPLOYEE") return false;
  if (access.role === "EMPLOYEE" && (!access.isAssistantManager || target.isAssistantManager)) return false;
  return access.editableStores === null || access.editableStores.some((s) => s.id === target.locationId);
}

export async function assertCanManageUser(req: Request, targetId: string) {
  const access = await getAccess(req);
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, businessId: true, isAssistantManager: true, locationId: true },
  });
  if (!target || !canManageTarget(access, req.user!, target)) {
    throw new ForbiddenError("You can't manage this person");
  }
}

// Store ids to filter team lists by, or null for every store
export async function getVisibleStoreIds(req: Request) {
  const access = await getAccess(req);
  return access.visibleStores?.map((s) => s.id) ?? null;
}

export async function getVisibleStores(req: Request) {
  return (await getAccess(req)).visibleStores;
}
