import prisma from "../lib/db.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";

export async function createCategory(businessId: string, name: string, color: string) {
  const existing = await prisma.category.findUnique({
    where: { businessId_name: { businessId, name } },
  });
  if (existing) throw new ConflictError("A category with this name already exists");

  return prisma.category.create({
    data: { name, color, businessId },
    include: { _count: { select: { users: true } } },
  });
}

export async function listCategories(businessId: string) {
  return prisma.category.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}

export async function updateCategory(id: string, data: { name?: string; color?: string }) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category");

  if (data.name && data.name !== category.name) {
    const duplicate = await prisma.category.findUnique({
      where: { businessId_name: { businessId: category.businessId, name: data.name } },
    });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictError("A category with this name already exists");
    }
  }

  return prisma.category.update({
    where: { id },
    data,
    include: { _count: { select: { users: true } } },
  });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category");

  await prisma.user.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id } });
}
