import prisma from "../lib/db.js";
import { NotFoundError } from "../lib/errors.js";

interface TemplateInput {
  name: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  locationId?: string | null;
}

const templateInclude = { location: { select: { id: true, name: true } } } as const;

// locationIds: the stores whose templates to include alongside all-store ones, or null for every store
export async function listTemplates(businessId: string, locationIds: string[] | null) {
  return prisma.shiftTemplate.findMany({
    where: {
      businessId,
      ...(locationIds ? { OR: [{ locationId: null }, { locationId: { in: locationIds } }] } : {}),
    },
    orderBy: [{ startTime: "asc" }, { name: "asc" }],
    include: templateInclude,
  });
}

export async function getTemplateStoreId(id: string, businessId: string) {
  const template = await prisma.shiftTemplate.findUnique({ where: { id }, select: { businessId: true, locationId: true } });
  if (!template || template.businessId !== businessId) throw new NotFoundError("Shift template");
  return template.locationId;
}

export async function createTemplate(businessId: string, data: TemplateInput) {
  return prisma.shiftTemplate.create({
    data: { ...data, notes: data.notes || null, locationId: data.locationId || null, businessId },
    include: templateInclude,
  });
}

export async function updateTemplate(id: string, data: TemplateInput) {
  return prisma.shiftTemplate.update({
    where: { id },
    data: { ...data, notes: data.notes || null, locationId: data.locationId || null },
    include: templateInclude,
  });
}

export async function deleteTemplate(id: string) {
  await prisma.shiftTemplate.delete({ where: { id } });
}
