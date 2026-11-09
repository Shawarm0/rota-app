import prisma from "../lib/db.js";

// The owner plus the store managers who run the given store (all store managers if no store is known)
export async function findStoreManagerIds(businessId: string, locationId: string | null, excludeUserId?: string) {
  const managers = await prisma.user.findMany({
    where: {
      businessId,
      active: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      OR: [
        { role: "OWNER" },
        locationId
          ? { role: "MANAGER", OR: [{ locationId }, { storeAccess: { some: { locationId } } }] }
          : { role: "MANAGER" },
      ],
    },
    select: { id: true },
  });
  return managers.map((m) => m.id);
}

export async function findLocationId(businessId: string, name: string | null) {
  if (!name) return null;
  const location = await prisma.location.findFirst({ where: { businessId, name }, select: { id: true } });
  return location?.id ?? null;
}
