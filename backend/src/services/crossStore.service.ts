import { Request } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/db.js";
import { ForbiddenError, NotFoundError, AppError } from "../lib/errors.js";
import { getAccess } from "../middleware/authorize.js";
import { sendPush } from "./push.service.js";

// Shifts given to someone from another store need their home store manager's approval, unless the person
// assigning them can already manage that home store (the owner, or a manager with edit access to it).

const shortDate = (date: Date) => date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

// Store managers of a store (including those the owner has given edit access), or the owners if it has none
async function homeStoreApprovers(businessId: string, locationId: string) {
  const managers = await prisma.user.findMany({
    where: {
      businessId,
      active: true,
      role: "MANAGER",
      OR: [{ locationId }, { storeAccess: { some: { locationId, canEdit: true } } }],
    },
    select: { id: true },
  });
  if (managers.length) return managers.map((m) => m.id);
  const owners = await prisma.user.findMany({ where: { businessId, active: true, role: "OWNER" }, select: { id: true } });
  return owners.map((o) => o.id);
}

async function canApproveFor(req: Request, homeStoreId: string | null) {
  const access = await getAccess(req);
  return access.editableStores === null || (!!homeStoreId && access.editableStores.some((s) => s.id === homeStoreId));
}

// Whether giving this person a shift at this store needs their home store manager's approval
export async function needsApproval(req: Request, userId: string | null | undefined, storeName: string | null) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { location: { select: { id: true, name: true } } } });
  const home = user?.location;
  if (!home || home.name === storeName) return false;
  return !(await canApproveFor(req, home.id));
}

// Marks newly assigned shifts that need approval as pending and asks the home store managers
export async function requestApprovalsIfNeeded(req: Request, where: Prisma.ShiftWhereInput) {
  const access = await getAccess(req);
  if (access.editableStores === null) return;

  const shifts = await prisma.shift.findMany({
    where: { ...where, userId: { not: null }, crossStoreStatus: "NONE", status: { not: "AVAILABLE" } },
    select: {
      id: true,
      date: true,
      location: true,
      user: { select: { id: true, firstName: true, lastName: true, location: { select: { id: true, name: true } } } },
      rota: { select: { businessId: true, location: { select: { name: true } } } },
    },
    orderBy: { date: "asc" },
  });
  const pending = shifts.filter((s) => {
    const home = s.user?.location;
    const store = s.location || s.rota.location?.name || null;
    return home && home.name !== store && !access.editableStores!.some((e) => e.id === home.id);
  });
  if (!pending.length) return;

  await prisma.shift.updateMany({
    where: { id: { in: pending.map((s) => s.id) } },
    data: { crossStoreStatus: "PENDING", requestedById: req.user!.userId },
  });

  // One request per person and store, e.g. "Tom at Euxton asked for Priya Patel for 3 shifts (Mon 3 Nov – Fri 7 Nov)"
  const requester = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true } });
  const groups = new Map<string, typeof pending>();
  for (const shift of pending) {
    const key = `${shift.user!.id}|${shift.location || shift.rota.location?.name}`;
    groups.set(key, [...(groups.get(key) ?? []), shift]);
  }
  const notifications = [];
  for (const group of groups.values()) {
    const { user, rota, location } = group[0];
    const store = location || rota.location?.name || "another store";
    const dates = group.length === 1 ? shortDate(group[0].date) : `${shortDate(group[0].date)} – ${shortDate(group[group.length - 1].date)}`;
    const body = `${requester?.firstName} ${requester?.lastName} at ${store} wants ${user!.firstName} ${user!.lastName} for ${group.length} shift${group.length > 1 ? "s" : ""} (${dates}). Approve or reject it on your dashboard.`;
    for (const approverId of await homeStoreApprovers(rota.businessId, user!.location!.id)) {
      notifications.push({ userId: approverId, title: "Shift Request", body, data: { type: "CROSS_STORE_REQUEST", shiftId: group[0].id } });
    }
  }
  if (notifications.length) {
    await prisma.notification.createMany({ data: notifications });
    sendPush(notifications);
  }
}

// Pending requests for staff whose home store this person manages
export async function listPendingApprovals(req: Request) {
  const access = await getAccess(req);
  const shifts = await prisma.shift.findMany({
    where: {
      crossStoreStatus: "PENDING",
      userId: { not: null },
      rota: { businessId: req.user!.businessId! },
      ...(access.editableStores === null ? {} : { user: { locationId: { in: access.editableStores.map((s) => s.id) } } }),
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      location: true,
      requestedById: true,
      user: { select: { id: true, firstName: true, lastName: true } },
      rota: { select: { status: true, location: { select: { name: true } } } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const requesterIds = [...new Set(shifts.map((s) => s.requestedById).filter((id): id is string => !!id))];
  const requesters = await prisma.user.findMany({ where: { id: { in: requesterIds } }, select: { id: true, firstName: true, lastName: true } });
  const names = new Map(requesters.map((r) => [r.id, `${r.firstName} ${r.lastName}`]));
  return shifts.map(({ rota, requestedById, ...shift }) => ({
    ...shift,
    store: shift.location || rota.location?.name || null,
    draft: rota.status === "DRAFT",
    requestedBy: requestedById ? (names.get(requestedById) ?? null) : null,
  }));
}

// The home store manager approves (the person gets the shift) or rejects (it becomes an open shift)
export async function decideApproval(req: Request, shiftId: string, approve: boolean) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      location: true,
      crossStoreStatus: true,
      requestedById: true,
      user: { select: { id: true, firstName: true, lastName: true, locationId: true } },
      rota: { select: { businessId: true, status: true, location: { select: { name: true } } } },
    },
  });
  if (!shift || shift.rota.businessId !== req.user!.businessId) throw new NotFoundError("Shift");
  if (shift.crossStoreStatus !== "PENDING" || !shift.user) throw new AppError(400, "This request has already been dealt with");
  if (!(await canApproveFor(req, shift.user.locationId))) {
    throw new ForbiddenError("Only their home store's manager can decide this");
  }

  const store = shift.location || shift.rota.location?.name || "another store";
  const when = `${shortDate(shift.date)}, ${shift.startTime}–${shift.endTime} at ${store}`;
  const name = `${shift.user.firstName} ${shift.user.lastName}`;
  const notifications = [];

  if (approve) {
    await prisma.shift.update({ where: { id: shiftId }, data: { crossStoreStatus: "APPROVED" } });
    // Only tell the employee once the shift is on a published rota they can see
    if (shift.rota.status === "PUBLISHED") {
      notifications.push({
        userId: shift.user.id,
        title: "New Shift",
        body: `You've been given a shift on ${when}.`,
        data: { type: "SHIFT_ADDITIONAL", shiftId },
      });
    }
  } else {
    // The store still needs cover, so the shift stays as an open shift
    await prisma.shift.update({
      where: { id: shiftId },
      data: { userId: null, status: "AVAILABLE", crossStoreStatus: "NONE", requestedById: null },
    });
  }

  if (shift.requestedById) {
    notifications.push({
      userId: shift.requestedById,
      title: approve ? "Shift Request Approved" : "Shift Request Rejected",
      body: approve
        ? `${name} can work ${when}.`
        : `${name} can't work ${when}. The shift is now open for cover.`,
      data: { type: "CROSS_STORE_DECISION", shiftId },
    });
  }
  if (notifications.length) {
    await prisma.notification.createMany({ data: notifications });
    sendPush(notifications);
  }
  return { name, when, approved: approve };
}
