import { ShiftStatus } from "@prisma/client";
import prisma from "../lib/db.js";
import { AppError, ConflictError, NotFoundError } from "../lib/errors.js";

interface CreateShiftInput {
  userId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  notes?: string | null;
  status?: ShiftStatus;
}

async function checkApprovedHoliday(userId: string, date: string) {
  const holiday = await prisma.holidayRequest.findFirst({
    where: { userId, date: new Date(date), status: "APPROVED" },
  });
  if (holiday) {
    throw new ConflictError("This employee has an approved holiday on this date");
  }
}

export async function createShift(rotaId: string, data: CreateShiftInput) {
  const rota = await prisma.rota.findUnique({
    where: { id: rotaId },
    include: { location: { select: { name: true } } },
  });
  if (!rota) throw new NotFoundError("Rota");
  if (rota.status === "PUBLISHED") {
    throw new AppError(400, "Cannot add shifts to a published rota");
  }

  if (data.userId) {
    await checkApprovedHoliday(data.userId, data.date);
    await checkTimeConflict(data.userId, data.date, data.startTime, data.endTime);
  }

  const shiftLocation = data.location ?? rota.location?.name ?? null;

  return prisma.shift.create({
    data: {
      rotaId,
      userId: data.userId || null,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      location: shiftLocation,
      notes: data.notes || null,
      status: data.status || "ASSIGNED",
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, categoryId: true, category: { select: { id: true, name: true, color: true } } } },
    },
  });
}

export async function updateShift(id: string, data: Partial<CreateShiftInput>) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: { rota: true },
  });
  if (!shift) throw new NotFoundError("Shift");

  if (data.userId && data.userId !== shift.userId) {
    const dateStr = data.date || shift.date.toISOString().split("T")[0];
    await checkApprovedHoliday(data.userId, dateStr);
    await checkTimeConflict(
      data.userId,
      dateStr,
      data.startTime || shift.startTime,
      data.endTime || shift.endTime,
      id,
    );
  }

  let autoStatus = data.status;
  if (data.userId !== undefined) {
    if (!data.userId) {
      autoStatus = "AVAILABLE";
    } else if (!autoStatus && shift.status === "AVAILABLE") {
      autoStatus = "ASSIGNED";
    }
  }

  return prisma.shift.update({
    where: { id },
    data: {
      ...(data.userId !== undefined ? { userId: data.userId || null } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.startTime ? { startTime: data.startTime } : {}),
      ...(data.endTime ? { endTime: data.endTime } : {}),
      ...(data.location !== undefined ? { location: data.location || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(autoStatus ? { status: autoStatus } : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, categoryId: true, category: { select: { id: true, name: true, color: true } } } },
    },
  });
}

export async function deleteShift(id: string) {
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) throw new NotFoundError("Shift");

  await prisma.shift.delete({ where: { id } });
}

export async function bulkCreateShifts(rotaId: string, shifts: CreateShiftInput[]) {
  const rota = await prisma.rota.findUnique({
    where: { id: rotaId },
    include: { location: { select: { name: true } } },
  });
  if (!rota) throw new NotFoundError("Rota");
  if (rota.status === "PUBLISHED") {
    throw new AppError(400, "Cannot add shifts to a published rota");
  }

  for (const s of shifts) {
    if (s.userId) {
      await checkApprovedHoliday(s.userId, s.date);
      await checkTimeConflict(s.userId, s.date, s.startTime, s.endTime);
    }
  }

  const created = await prisma.shift.createMany({
    data: shifts.map((s) => ({
      rotaId,
      userId: s.userId || null,
      date: new Date(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location ?? rota.location?.name ?? null,
      notes: s.notes || null,
      status: s.status || "ASSIGNED",
    })),
  });

  return { count: created.count };
}

export async function getShiftsForUser(userId: string, from?: string, to?: string) {
  return prisma.shift.findMany({
    where: {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      rota: { status: "PUBLISHED" },
    },
    include: {
      rota: { select: { id: true, startDate: true, endDate: true, status: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getAllShifts(businessId: string, from?: string, to?: string, location?: string) {
  return prisma.shift.findMany({
    where: {
      rota: {
        businessId,
        status: "PUBLISHED",
      },
      ...(location ? { location } : {}),
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
      user: { select: { id: true, firstName: true, lastName: true, categoryId: true, category: { select: { id: true, name: true, color: true } } } },
      rota: { select: { id: true, startDate: true, endDate: true, status: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getAvailableShifts(businessId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locationId: true, location: { select: { name: true } } },
  });

  const locationName = user?.location?.name;

  return prisma.shift.findMany({
    where: {
      rota: { businessId, status: "PUBLISHED" },
      status: "AVAILABLE",
      date: { gte: new Date() },
      ...(locationName
        ? { OR: [{ location: locationName }, { location: null }] }
        : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, categoryId: true, category: { select: { id: true, name: true, color: true } } } },
      rota: { select: { id: true, startDate: true, endDate: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function claimShift(shiftId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: { id: shiftId },
      include: { rota: true },
    });

    if (!shift) throw new NotFoundError("Shift");
    if (shift.status !== "AVAILABLE") {
      throw new ConflictError("This shift is no longer available");
    }

    const dateStr = shift.date.toISOString().split("T")[0];

    const holiday = await tx.holidayRequest.findFirst({
      where: { userId, date: shift.date, status: "APPROVED" },
    });
    if (holiday) {
      throw new ConflictError("You have an approved holiday on this date");
    }

    await checkTimeConflictTx(tx, userId, dateStr, shift.startTime, shift.endTime);

    const newStatus: ShiftStatus = "ADDITIONAL";

    const claimed = await tx.shift.update({
      where: { id: shiftId },
      data: { userId, status: newStatus },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, categoryId: true, category: { select: { id: true, name: true, color: true } } } },
      },
    });

    const claimingUser = await tx.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const managers = await tx.user.findMany({
      where: { businessId: shift.rota.businessId, role: "MANAGER", active: true },
      select: { id: true },
    });

    const notifications = [
      ...managers.map((m) => ({
        userId: m.id,
        title: "Shift Claimed",
        body: `${claimingUser?.firstName} ${claimingUser?.lastName} claimed a shift on ${dateStr}.`,
        data: JSON.stringify({ type: "SHIFT_CLAIMED", shiftId }),
      })),
    ];

    if (notifications.length > 0) {
      await tx.notification.createMany({ data: notifications });
    }

    return claimed;
  });
}

export async function requestCover(shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { rota: true },
  });
  if (!shift) throw new NotFoundError("Shift");
  if (shift.status !== "AVAILABLE") {
    throw new AppError(400, "Only available shifts can be put up for cover");
  }

  const dateStr = shift.date.toISOString().split("T")[0];

  const employees = await prisma.user.findMany({
    where: {
      businessId: shift.rota.businessId,
      role: "EMPLOYEE",
      active: true,
      ...(shift.location
        ? { OR: [{ location: { name: shift.location } }, { locationId: null }] }
        : {}),
    },
    select: { id: true },
  });

  if (employees.length > 0) {
    await prisma.notification.createMany({
      data: employees.map((emp) => ({
        userId: emp.id,
        title: "Shift Available",
        body: `A shift on ${dateStr} (${shift.startTime}-${shift.endTime}${shift.location ? ` at ${shift.location}` : ""}) needs cover. Check the Shift Pot to claim it.`,
        data: { type: "SHIFT_COVER", shiftId },
      })),
    });
  }

  return { notified: employees.length };
}

export async function syncShifts(
  rotaId: string,
  shifts: { userId?: string | null; date: string; startTime: string; endTime: string; location?: string | null; notes?: string | null; status?: ShiftStatus }[],
) {
  const rota = await prisma.rota.findUnique({ where: { id: rotaId } });
  if (!rota) throw new NotFoundError("Rota");
  if (rota.status === "PUBLISHED") {
    throw new AppError(400, "Cannot modify shifts on a published rota");
  }

  return prisma.$transaction(async (tx) => {
    await tx.shift.deleteMany({ where: { rotaId } });

    if (shifts.length > 0) {
      await tx.shift.createMany({
        data: shifts.map((s) => ({
          rotaId,
          userId: s.userId || null,
          date: new Date(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location || null,
          notes: s.notes || null,
          status: s.status || "ASSIGNED",
        })),
      });
    }

    return tx.shift.findMany({
      where: { rotaId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  });
}

export async function createAdditionalShift(
  businessId: string,
  data: { userId: string; date: string; startTime: string; endTime: string; location?: string | null; notes?: string | null },
) {
  await checkApprovedHoliday(data.userId, data.date);
  await checkTimeConflict(data.userId, data.date, data.startTime, data.endTime);

  const shiftDate = new Date(data.date);

  let rota = await prisma.rota.findFirst({
    where: {
      businessId,
      status: "PUBLISHED",
      startDate: { lte: shiftDate },
      endDate: { gte: shiftDate },
    },
  });

  if (!rota) {
    const start = new Date(shiftDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 13);

    rota = await prisma.rota.create({
      data: {
        businessId,
        name: "Additional Shifts",
        startDate: start,
        endDate: end,
        status: "PUBLISHED",
      },
    });
  }

  return prisma.shift.create({
    data: {
      rotaId: rota.id,
      userId: data.userId,
      date: shiftDate,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location || null,
      notes: data.notes || null,
      status: "ADDITIONAL",
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, categoryId: true, category: { select: { id: true, name: true, color: true } } } },
    },
  });
}

async function checkTimeConflict(
  userId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeShiftId?: string,
) {
  const conflicts = await prisma.shift.findMany({
    where: {
      userId,
      date: new Date(date),
      status: { not: "AVAILABLE" },
      ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
    },
  });

  for (const existing of conflicts) {
    if (startTime < existing.endTime && endTime > existing.startTime) {
      throw new ConflictError(
        `Time conflict with existing shift ${existing.startTime}-${existing.endTime}`,
      );
    }
  }
}

async function checkTimeConflictTx(
  tx: any,
  userId: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  const conflicts = await tx.shift.findMany({
    where: {
      userId,
      date: new Date(date),
      status: { not: "AVAILABLE" },
    },
  });

  for (const existing of conflicts) {
    if (startTime < existing.endTime && endTime > existing.startTime) {
      throw new ConflictError("You have a conflicting shift on this date");
    }
  }
}
