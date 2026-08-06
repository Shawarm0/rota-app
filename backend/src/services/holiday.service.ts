import prisma from "../lib/db.js";
import { AppError, ForbiddenError, NotFoundError } from "../lib/errors.js";

export async function requestHoliday(userId: string, data: { date: string; shiftId?: string | null; reason?: string | null }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessId: true, firstName: true, lastName: true } });
  if (!user) throw new NotFoundError("User");

  const existing = await prisma.holidayRequest.findFirst({
    where: { userId, date: new Date(data.date), status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) {
    throw new AppError(400, "You already have a holiday request for this date");
  }

  const request = await prisma.holidayRequest.create({
    data: {
      userId,
      date: new Date(data.date),
      shiftId: data.shiftId || null,
      reason: data.reason || null,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      shift: true,
    },
  });

  const managers = await prisma.user.findMany({
    where: { businessId: user.businessId, role: "MANAGER", active: true },
    select: { id: true },
  });

  if (managers.length > 0) {
    await prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: "Holiday Request",
        body: `${user.firstName} ${user.lastName} requested holiday on ${data.date}.`,
        data: { type: "HOLIDAY_REQUEST", holidayRequestId: request.id },
      })),
    });
  }

  return request;
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
        status: { notIn: ["CANCELLED", "AVAILABLE"] },
      },
      data: { status: "AVAILABLE", userId: null },
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        title: "Holiday Approved",
        body: `Your holiday request for ${request.date.toISOString().split("T")[0]} has been approved.`,
        data: { type: "HOLIDAY_APPROVED", holidayRequestId: requestId },
      },
    });

    return approved;
  });

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

  await prisma.notification.create({
    data: {
      userId: request.userId,
      title: "Holiday Rejected",
      body: `Your holiday request for ${request.date.toISOString().split("T")[0]} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      data: { type: "HOLIDAY_REJECTED", holidayRequestId: requestId },
    },
  });

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

export async function listHolidayRequests(businessId: string, status?: string) {
  return prisma.holidayRequest.findMany({
    where: {
      user: { businessId },
      ...(status ? { status: status as any } : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
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

export async function getMyHolidayRequests(userId: string) {
  return prisma.holidayRequest.findMany({
    where: { userId },
    include: { shift: true },
    orderBy: { createdAt: "desc" },
  });
}
