import prisma from "../lib/db.js";
import { findStoreManagerIds } from "./recipients.service.js";
import { sendPush } from "./push.service.js";
import { AppError, ForbiddenError, NotFoundError } from "../lib/errors.js";

export async function requestHoliday(userId: string, data: { date: string; days?: number; shiftId?: string | null; reason?: string | null }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessId: true, locationId: true, role: true, firstName: true, lastName: true } });
  if (!user) throw new NotFoundError("User");

  const numDays = data.days || 1;
  const startDate = new Date(data.date);
  const dates: Date[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  for (const date of dates) {
    const existing = await prisma.holidayRequest.findFirst({
      where: { userId, date, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (existing) {
      throw new AppError(400, `You already have a holiday request for ${date.toISOString().split("T")[0]}`);
    }
  }

  const requests: Awaited<ReturnType<typeof prisma.holidayRequest.create>>[] = [];
  for (const date of dates) {
    const request = await prisma.holidayRequest.create({
      data: {
        userId,
        date,
        shiftId: data.shiftId || null,
        reason: data.reason || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        shift: true,
      },
    });
    requests.push(request);
  }

  // Tell everyone who can decide the request: the owner and the store's managers, plus the store's
  // assistant managers for regular staff. A store manager's own leave goes to the owner only.
  let recipientIds: string[];
  if (user.role === "MANAGER") {
    const owners = await prisma.user.findMany({ where: { businessId: user.businessId, role: "OWNER", active: true }, select: { id: true } });
    recipientIds = owners.map((o) => o.id);
  } else {
    const assistants = await prisma.user.findMany({
      where: {
        businessId: user.businessId,
        active: true,
        isAssistantManager: true,
        id: { not: userId },
        // Store-based assistant managers only hear about their own store's staff
        OR: [{ locationId: null }, ...(user.locationId ? [{ locationId: user.locationId }] : [])],
      },
      select: { id: true },
    });
    recipientIds = [
      ...new Set([...(await findStoreManagerIds(user.businessId!, user.locationId, userId)), ...assistants.map((a) => a.id)]),
    ];
  }
  const managers = recipientIds.map((id) => ({ id }));

  if (managers.length > 0) {
    const dateRange = numDays === 1
      ? data.date
      : `${data.date} to ${dates[dates.length - 1].toISOString().split("T")[0]}`;
    const notifications = managers.map((m) => ({
      userId: m.id,
      title: "Holiday Request",
      body: `${user.firstName} ${user.lastName} requested ${numDays} day${numDays > 1 ? "s" : ""} holiday (${dateRange}).`,
      data: { type: "HOLIDAY_REQUEST", holidayRequestId: requests[0].id },
    }));
    await prisma.notification.createMany({ data: notifications });
    sendPush(notifications);
  }

  return requests;
}

export async function approveHoliday(requestId: string) {
  const request = await prisma.holidayRequest.findUnique({
    where: { id: requestId },
    include: { shift: true, user: true },
  });
  if (!request) throw new NotFoundError("Holiday request");
  if (request.status !== "PENDING") {
    throw new AppError(400, `Cannot approve a ${request.status.toLowerCase()} request`);
  }

  const notification = {
    userId: request.userId,
    title: "Holiday Approved",
    body: `Your holiday request for ${request.date.toISOString().split("T")[0]} has been approved.`,
    data: { type: "HOLIDAY_APPROVED", holidayRequestId: requestId },
  };

  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.holidayRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    await tx.shift.updateMany({
      where: {
        userId: request.userId,
        date: request.date,
        status: { not: "AVAILABLE" },
      },
      data: { status: "AVAILABLE", userId: null, crossStoreStatus: "NONE", requestedById: null },
    });

    await tx.notification.create({ data: notification });

    return approved;
  });

  sendPush([notification]);
  await notifyOtherStores(request.userId, request.date);
  return updated;
}

export async function rejectHoliday(requestId: string, reason?: string) {
  const request = await prisma.holidayRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Holiday request");
  if (request.status !== "PENDING") {
    throw new AppError(400, `Cannot reject a ${request.status.toLowerCase()} request`);
  }

  const updated = await prisma.holidayRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  const notification = {
    userId: request.userId,
    title: "Holiday Rejected",
    body: `Your holiday request for ${request.date.toISOString().split("T")[0]} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
    data: { type: "HOLIDAY_REJECTED", holidayRequestId: requestId },
  };
  await prisma.notification.create({ data: notification });
  sendPush([notification]);

  return updated;
}

export async function cancelHoliday(requestId: string, userId: string) {
  const request = await prisma.holidayRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Holiday request");
  if (request.userId !== userId) throw new ForbiddenError("You can only cancel your own requests");
  if (request.status !== "PENDING") {
    throw new AppError(400, "Can only cancel pending requests");
  }

  return prisma.holidayRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });
}

export async function updateHoliday(requestId: string, data: { date?: string; reason?: string | null; status?: "PENDING" | "APPROVED" | "REJECTED" }) {
  const request = await prisma.holidayRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Holiday request");

  if (data.date) {
    const newDate = new Date(data.date);

    const existingHoliday = await prisma.holidayRequest.findFirst({
      where: {
        userId: request.userId,
        date: newDate,
        status: { in: ["PENDING", "APPROVED"] },
        id: { not: requestId },
      },
    });
    if (existingHoliday) {
      throw new AppError(400, "This person already has a holiday request on that date");
    }

    const assignedShift = await prisma.shift.findFirst({
      where: {
        userId: request.userId,
        date: newDate,
        status: { not: "AVAILABLE" },
      },
    });
    if (assignedShift) {
      throw new AppError(400, "This person has a shift on that date — please unassign it before moving their holiday");
    }
  }

  const effectiveDate = data.date ? new Date(data.date) : request.date;

  if (data.status === "APPROVED" && request.status !== "APPROVED") {
    const approved = await prisma.$transaction(async (tx) => {
      const updated = await tx.holidayRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.reason !== undefined ? { reason: data.reason } : {}),
        },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      });

      await tx.shift.updateMany({
        where: {
          userId: request.userId,
          date: effectiveDate,
          status: { not: "AVAILABLE" },
        },
        data: { status: "AVAILABLE", userId: null, crossStoreStatus: "NONE", requestedById: null },
      });

      return updated;
    });
    await notifyDecision(request.userId, requestId, approved.date, "APPROVED");
    await notifyOtherStores(request.userId, approved.date);
    return approved;
  }

  const updated = await prisma.holidayRequest.update({
    where: { id: requestId },
    data: {
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.reason !== undefined ? { reason: data.reason } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (data.status === "REJECTED" && request.status !== "REJECTED") {
    await notifyDecision(request.userId, requestId, updated.date, "REJECTED");
  }
  return updated;
}

// Tells the managers of other stores someone also works at, since their rotas may be affected
async function notifyOtherStores(userId: string, date: Date) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, businessId: true, workStores: { select: { locationId: true } } },
  });
  if (!user?.workStores.length) return;
  const managers = await prisma.user.findMany({
    where: { businessId: user.businessId, active: true, role: "MANAGER", locationId: { in: user.workStores.map((w) => w.locationId) } },
    select: { id: true },
  });
  if (!managers.length) return;
  await prisma.notification.createMany({
    data: managers.map((m) => ({
      userId: m.id,
      title: "Holiday Booked",
      body: `${user.firstName} ${user.lastName} is on holiday on ${date.toISOString().split("T")[0]}.`,
      data: { type: "HOLIDAY_NOTICE" },
    })),
  });
}

// Tells the employee when their leave is approved or rejected from the edit form
async function notifyDecision(userId: string, requestId: string, date: Date, status: "APPROVED" | "REJECTED") {
  const approved = status === "APPROVED";
  const notification = {
    userId,
    title: approved ? "Holiday Approved" : "Holiday Rejected",
    body: `Your holiday request for ${date.toISOString().split("T")[0]} has been ${approved ? "approved" : "rejected"}.`,
    data: { type: approved ? "HOLIDAY_APPROVED" : "HOLIDAY_REJECTED", holidayRequestId: requestId },
  };
  await prisma.notification.create({ data: notification });
  sendPush([notification]);
}

export async function deleteHoliday(requestId: string) {
  const request = await prisma.holidayRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Holiday request");

  await prisma.holidayRequest.delete({ where: { id: requestId } });
}

export async function listHolidayRequests(businessId: string, status?: string, locationIds?: string[] | null) {
  return prisma.holidayRequest.findMany({
    where: {
      user: { businessId, ...(locationIds ? { locationId: { in: locationIds } } : {}) },
      ...(status ? { status: status as any } : {}),
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true, businessId: true, isAssistantManager: true, locationId: true },
      },
      shift: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApprovedHolidays(userId: string, from?: string, to?: string) {
  return prisma.holidayRequest.findMany({
    where: {
      userId,
      status: "APPROVED",
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "asc" },
  });
}

export async function getBusinessHolidays(businessId: string, from?: string, to?: string, locationIds?: string[] | null) {
  return prisma.holidayRequest.findMany({
    where: {
      user: { businessId, ...(locationIds ? { locationId: { in: locationIds } } : {}) },
      status: { in: ["PENDING", "APPROVED"] },
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { date: "asc" },
  });
}

export async function getMyHolidayRequests(userId: string) {
  return prisma.holidayRequest.findMany({
    where: { userId },
    include: { shift: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequestOwnerId(requestId: string) {
  const request = await prisma.holidayRequest.findUnique({ where: { id: requestId }, select: { userId: true } });
  if (!request) throw new NotFoundError("Holiday request");
  return request.userId;
}
