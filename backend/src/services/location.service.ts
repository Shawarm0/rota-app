import prisma from "../lib/db.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";

export async function createLocation(businessId: string, name: string) {
  const existing = await prisma.location.findUnique({
    where: { businessId_name: { businessId, name } },
  });
  if (existing) throw new ConflictError("A location with this name already exists");

  return prisma.location.create({
    data: { name, businessId },
  });
}

export async function listLocations(businessId: string) {
  return prisma.location.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}

export async function updateLocation(id: string, name: string, businessId: string) {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location || location.businessId !== businessId) throw new NotFoundError("Location");

  const duplicate = await prisma.location.findUnique({
    where: { businessId_name: { businessId: location.businessId, name } },
  });
  if (duplicate && duplicate.id !== id) {
    throw new ConflictError("A location with this name already exists");
  }

  // Shifts refer to their store by name, so keep them pointing at the renamed store
  return prisma.$transaction(async (tx) => {
    await tx.shift.updateMany({ where: { location: location.name, rota: { businessId } }, data: { location: name } });
    return tx.location.update({ where: { id }, data: { name } });
  });
}

export async function deleteLocation(id: string, businessId: string) {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location || location.businessId !== businessId) throw new NotFoundError("Location");

  await prisma.user.updateMany({ where: { locationId: id }, data: { locationId: null } });
  await prisma.rota.updateMany({ where: { locationId: id }, data: { locationId: null } });
  await prisma.location.delete({ where: { id } });
}

export async function findStore(businessId: string, id: string) {
  return prisma.location.findFirst({ where: { id, businessId }, select: { id: true, name: true } });
}
