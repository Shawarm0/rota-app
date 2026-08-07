import prisma from "../lib/db.js";
import { AppError, ForbiddenError, NotFoundError } from "../lib/errors.js";

export async function requestHoliday(userId: string, data: { date: string; days?: number; shiftId?: string | null; reason?: string | null }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessId: true, firstName: true, lastName: true } });
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

  const managers = await prisma.user.findMany({
    where: { businessId: user.businessId, role: "MANAGER", active: true },
    select: { id: true },
  });

  if (managers.length > 0) {
    const dateRange = numDays === 1
      ? data.date
      : `${data.date} to ${dates[dates.length - 1].toISOString().split("T")[0]}`;
    await prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: "Holiday Request",
        body: `${user.firstName} ${user.lastName} requested ${numDays} day${numDays > 1 ? "s" : ""} holiday (${dateRange}).`,
        data: { type: "HOLIDAY_REQUEST", holidayRequestId: requests[0].id },
      })),
    });
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
    return prisma.$transaction(async (tx) => {
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
        data: { status: "AVAILABLE", userId: null },
      });

      return updated;
    });
  }

  return prisma.holidayRequest.update({
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
}

export async function deleteHoliday(requestId: string) {
  const request = await prisma.holidayRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Holiday request");

  await prisma.holidayRequest.delete({ where: { id: requestId } });
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

export async function getBusinessHolidays(businessId: string, from?: string, to?: string) {
  return prisma.holidayRequest.findMany({
    where: {
      user: { businessId },
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
