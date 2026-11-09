import prisma from "../lib/db.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";

const categoryInclude = {
  location: { select: { id: true, name: true } },
  _count: { select: { users: true } },
} as const;

export async function createCategory(businessId: string, locationId: string, name: string, color: string) {
  const location = await prisma.location.findFirst({ where: { id: locationId, businessId } });
  if (!location) throw new NotFoundError("Location");

  const existing = await prisma.category.findUnique({ where: { locationId_name: { locationId, name } } });
  if (existing) throw new ConflictError("This store already has a category with this name");

  return prisma.category.create({
    data: { name, color, businessId, locationId },
    include: categoryInclude,
  });
}

// locationIds: the stores whose categories to list, or null for every store
export async function listCategories(businessId: string, locationIds: string[] | null) {
  return prisma.category.findMany({
    where: { businessId, ...(locationIds ? { locationId: { in: locationIds } } : {}) },
    orderBy: [{ location: { name: "asc" } }, { name: "asc" }],
    include: categoryInclude,
  });
}

export async function getCategoryStoreId(id: string, businessId: string) {
  const category = await prisma.category.findUnique({ where: { id }, select: { businessId: true, locationId: true } });
  if (!category || category.businessId !== businessId) throw new NotFoundError("Category");
  return category.locationId;
}

export async function updateCategory(id: string, data: { name?: string; color?: string }) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category");

  if (data.name && data.name !== category.name) {
    const duplicate = await prisma.category.findFirst({ where: { locationId: category.locationId, name: data.name } });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictError("This store already has a category with this name");
    }
  }

  return prisma.category.update({ where: { id }, data, include: categoryInclude });
}

export async function deleteCategory(id: string) {
  await prisma.user.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id } });
}
