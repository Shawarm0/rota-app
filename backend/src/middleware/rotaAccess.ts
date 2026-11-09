import { Request } from "express";
import prisma from "../lib/db.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import { canEditStoreName, getAccess } from "./authorize.js";

// Rotas for a store can only be built by the owner or someone who runs that store.
// Rotas with no store are the owner's.
export async function assertCanUseStore(req: Request, locationId: string | null | undefined) {
  const access = await getAccess(req);
  if (locationId) {
    const store = await prisma.location.findFirst({ where: { id: locationId, businessId: req.user!.businessId! } });
    if (!store) throw new ForbiddenError("Unknown store");
  }
  if (access.editableStores === null) return;
  if (!locationId || !access.editableStores.some((s) => s.id === locationId)) {
    const names = access.editableStores.map((s) => s.name).join(" or ");
    throw new ForbiddenError(names ? `You can only manage rotas for ${names}` : "You can't manage rotas");
  }
}

export async function assertCanEditRota(req: Request, rotaId: string) {
  const rota = await prisma.rota.findUnique({
    where: { id: rotaId },
    select: { id: true, businessId: true, locationId: true, location: { select: { name: true } } },
  });
  if (!rota || rota.businessId !== req.user!.businessId) throw new NotFoundError("Rota");
  await assertCanUseStore(req, rota.locationId);
  return rota;
}

// Every shift saved into a rota must be at a store the person runs (shifts without a location use the rota's)
export async function assertShiftsAtEditableStores(req: Request, rotaStore: string | null, shifts: { location?: string | null }[]) {
  const access = await getAccess(req);
  const outside = shifts.map((s) => s.location || rotaStore).find((store) => !canEditStoreName(access, store));
  if (outside !== undefined) {
    throw new ForbiddenError(`You can't add shifts at ${outside ?? "a shift with no store"}`);
  }
}
