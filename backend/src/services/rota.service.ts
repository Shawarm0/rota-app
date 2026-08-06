import { RotaStatus } from "@prisma/client";
import prisma from "../lib/db.js";
import { AppError, ForbiddenError, NotFoundError } from "../lib/errors.js";

export async function createRota(businessId: string, data: { name?: string; startDate: string; endDate: string; locationId?: string }) {
  return prisma.rota.create({
    data: {
      businessId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      locationId: data.locationId || null,
      status: "DRAFT",
    },
    include: {
      location: { select: { id: true, name: true } },
    },
  });
}

export async function listRotas(businessId: string, role: string, status?: RotaStatus, locationId?: string) {
  return prisma.rota.findMany({
    where: {
      businessId,
      ...(role === "EMPLOYEE" ? { status: "PUBLISHED" } : {}),
      ...(status ? { status } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: {
      _count: { select: { shifts: true } },
      location: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getRota(id: string, role: string) {
  const rota = await prisma.rota.findUnique({
    where: { id },
    include: {
      location: { select: { id: true, name: true } },
      shifts: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });
  if (!rota) throw new NotFoundError("Rota");
  if (role === "EMPLOYEE" && rota.status === "DRAFT") {
    throw new ForbiddenError("This rota has not been published yet");
  }
  return rota;
}

export async function updateRota(id: string, data: { name?: string; startDate?: string; endDate?: string; locationId?: string | null }) {
  const rota = await prisma.rota.findUnique({ where: { id } });
  if (!rota) throw new NotFoundError("Rota");
  if (rota.status === "PUBLISHED") {
    throw new AppError(400, "Cannot edit a published rota");
  }

  return prisma.rota.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
      ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
    },
    include: {
      location: { select: { id: true, name: true } },
    },
  });
}

export async function deleteRota(id: string) {
  const rota = await prisma.rota.findUnique({ where: { id } });
  if (!rota) throw new NotFoundError("Rota");
  if (rota.status === "PUBLISHED") {
    throw new AppError(400, "Cannot delete a published rota");
  }

  await prisma.rota.delete({ where: { id } });
}

export async function publishRota(id: string) {
  const rota = await prisma.rota.findUnique({ where: { id } });
  if (!rota) throw new NotFoundError("Rota");
  if (rota.status === "PUBLISHED") {
    throw new AppError(400, "Rota is already published");
  }

  const published = await prisma.rota.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });

  const employees = await prisma.user.findMany({
    where: {
      businessId: rota.businessId,
      role: "EMPLOYEE",
      active: true,
      ...(rota.locationId ? { locationId: rota.locationId } : {}),
    },
    select: { id: true },
  });

  const startStr = rota.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const endStr = rota.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  if (employees.length > 0) {
    await prisma.notification.createMany({
      data: employees.map((emp) => ({
        userId: emp.id,
        title: "Rota Published",
        body: `Your rota for ${startStr} - ${endStr} has been published.`,
        data: { type: "ROTA_PUBLISHED", rotaId: id },
      })),
    });
  }

  return published;
}

export async function copyRota(sourceId: string, newStartDate: string, businessId: string) {
  const source = await prisma.rota.findUnique({
    where: { id: sourceId },
    include: { shifts: true },
  });
  if (!source) throw new NotFoundError("Source rota");

  const sourceStart = source.startDate.getTime();
  const newStart = new Date(newStartDate).getTime();
  const dayDiff = Math.round((newStart - sourceStart) / (1000 * 60 * 60 * 24));
  const duration = Math.round((source.endDate.getTime() - sourceStart) / (1000 * 60 * 60 * 24));

  const newRota = await prisma.rota.create({
    data: {
      businessId,
      name: source.name ? `${source.name} (copy)` : null,
      startDate: new Date(newStartDate),
      endDate: new Date(new Date(newStartDate).getTime() + duration * 24 * 60 * 60 * 1000),
      locationId: source.locationId,
      status: "DRAFT",
    },
  });

  if (source.shifts.length > 0) {
    await prisma.shift.createMany({
      data: source.shifts.map((shift) => ({
        rotaId: newRota.id,
        userId: shift.userId,
        date: new Date(shift.date.getTime() + dayDiff * 24 * 60 * 60 * 1000),
        startTime: shift.startTime,
        endTime: shift.endTime,
        location: shift.location,
        notes: shift.notes,
        status: "ASSIGNED",
      })),
    });
  }

  return prisma.rota.findUnique({
    where: { id: newRota.id },
    include: { _count: { select: { shifts: true } } },
  });
}
