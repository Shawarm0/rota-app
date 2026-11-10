import { Role } from "@prisma/client";
import prisma from "../lib/db.js";
import { staffAtStores } from "../lib/storeScope.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors.js";

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
  businessId?: string;
  locationId?: string;
  categoryId?: string;
}

// The system admin sets up owners; the owner adds store managers; anyone who manages staff adds employees
export async function createUser(input: CreateUserInput, creatorRole: Role, creatorBusinessId: string | null) {
  if (input.role === "OWNER" && creatorRole !== "SYSTEM_ADMIN") {
    throw new ForbiddenError("Only system admins can create owners");
  }
  if (input.role === "MANAGER" && creatorRole !== "OWNER" && creatorRole !== "SYSTEM_ADMIN") {
    throw new ForbiddenError("Only the owner can add store managers");
  }
  if (input.role === "EMPLOYEE" && creatorRole === "SYSTEM_ADMIN") {
    throw new ForbiddenError("Only managers can create employees");
  }

  const businessId = creatorRole === "SYSTEM_ADMIN" ? input.businessId : creatorBusinessId;
  if (!businessId) {
    throw new AppError(400, "Business ID is required");
  }
  await assertBelongsToBusiness(businessId, input.locationId, input.categoryId);
  if (input.role === "MANAGER") await assertStoreHasNoManager(input.locationId);

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      businessId,
      locationId: input.locationId || null,
      categoryId: input.categoryId || null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isAssistantManager: true,
      businessId: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      categoryId: true,
      category: { select: { id: true, name: true, color: true } },
      active: true,
      createdAt: true,
    },
  });
}

export async function listUsers(businessId: string | null, roles?: Role[], locationIds?: string[] | null) {
  return prisma.user.findMany({
    where: {
      ...(businessId ? { businessId } : {}),
      ...(roles?.length ? { role: { in: roles } } : {}),
      // Staff based at these stores or who also work at them
      ...(locationIds ? staffAtStores(locationIds) : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isAssistantManager: true,
      businessId: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      categoryId: true,
      category: { select: { id: true, name: true, color: true } },
      active: true,
      createdAt: true,
      storeAccess: { select: { locationId: true, canEdit: true } },
      workStores: { select: { locationId: true } },
    },
    orderBy: { firstName: "asc" },
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isAssistantManager: true,
      businessId: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      categoryId: true,
      category: { select: { id: true, name: true, color: true } },
      active: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function updateUser(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    locationId?: string | null;
    categoryId?: string | null;
    isAssistantManager?: boolean;
    role?: "MANAGER" | "EMPLOYEE";
    storeAccess?: { locationId: string; canEdit: boolean }[];
    workStoreIds?: string[];
  },
) {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, businessId: true, locationId: true, category: { select: { locationId: true } } },
  });
  if (!target) throw new NotFoundError("User");
  if (data.role && target.role !== "EMPLOYEE" && target.role !== "MANAGER") {
    throw new AppError(400, "Only staff can be made store managers or employees");
  }

  const role = data.role ?? target.role;
  const locationId = data.locationId !== undefined ? data.locationId : target.locationId;
  const storeIds = [...(data.storeAccess?.map((a) => a.locationId) ?? []), ...(data.workStoreIds ?? [])];
  await assertBelongsToBusiness(target.businessId!, locationId, data.categoryId, storeIds);
  if (data.isAssistantManager && role !== "EMPLOYEE") {
    throw new AppError(400, "Only employees can be made assistant managers");
  }
  if (data.storeAccess?.length && role !== "MANAGER") {
    throw new AppError(400, "Only store managers can be given access to other stores");
  }
  if (role === "MANAGER" && (data.role || data.locationId !== undefined)) {
    if (!locationId) throw new AppError(400, "A store manager needs a store");
    await assertStoreHasNoManager(locationId, id);
  }

  const { storeAccess, workStoreIds, ...fields } = data;
  // Moving to another store drops a category that belongs to the old one
  if (fields.categoryId === undefined && target.category && target.category.locationId !== locationId) {
    fields.categoryId = null;
  }
  return prisma.$transaction(async (tx) => {
    if (role !== "MANAGER" || storeAccess) {
      await tx.storeAccess.deleteMany({ where: { userId: id } });
    }
    if (role === "MANAGER" && storeAccess?.length) {
      await tx.storeAccess.createMany({
        data: storeAccess.filter((a) => a.locationId !== locationId).map((a) => ({ userId: id, ...a })),
      });
    }
    if (workStoreIds) {
      await tx.userWorkStore.deleteMany({ where: { userId: id } });
      const others = [...new Set(workStoreIds)].filter((s) => s !== locationId);
      if (others.length) await tx.userWorkStore.createMany({ data: others.map((locationId) => ({ userId: id, locationId })) });
    } else if (data.locationId !== undefined && locationId) {
      // Their new home store is no longer an "also works at" store
      await tx.userWorkStore.deleteMany({ where: { userId: id, locationId } });
    }
    return tx.user.update({
      where: { id },
      // Store managers aren't also assistant managers
      data: { ...fields, ...(role === "MANAGER" ? { isAssistantManager: false } : {}) },
      select: userSelect,
    });
  });
}

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isAssistantManager: true,
  businessId: true,
  locationId: true,
  location: { select: { id: true, name: true } },
  categoryId: true,
  category: { select: { id: true, name: true, color: true } },
  active: true,
  storeAccess: { select: { locationId: true, canEdit: true } },
      workStores: { select: { locationId: true } },
} as const;

// Each store has one store manager
async function assertStoreHasNoManager(locationId: string | null | undefined, exceptUserId?: string) {
  if (!locationId) return;
  const existing = await prisma.user.findFirst({
    where: { role: "MANAGER", locationId, active: true, ...(exceptUserId ? { id: { not: exceptUserId } } : {}) },
    select: { firstName: true, lastName: true, location: { select: { name: true } } },
  });
  if (existing) {
    throw new AppError(400, `${existing.location?.name} already has a store manager (${existing.firstName} ${existing.lastName})`);
  }
}

// Stops ids from another business being attached to someone
async function assertBelongsToBusiness(businessId: string, locationId?: string | null, categoryId?: string | null, storeIds?: string[]) {
  const locationIds = [...(locationId ? [locationId] : []), ...(storeIds ?? [])];
  if (locationIds.length) {
    const count = await prisma.location.count({ where: { businessId, id: { in: locationIds } } });
    if (count !== new Set(locationIds).size) throw new AppError(400, "Unknown store");
  }
  // A category belongs to one store, so it can only be given to staff at that store
  if (categoryId && !(await prisma.category.count({ where: { businessId, id: categoryId, locationId: locationId ?? "" } }))) {
    throw new AppError(400, "That category belongs to a different store");
  }
}

export async function disableUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { active: false },
    select: { id: true, active: true },
  });
}

export async function enableUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { active: true },
    select: { id: true, active: true },
  });
}

export async function deleteUser(id: string, callerRole: Role) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");
  if (callerRole !== "SYSTEM_ADMIN") {
    throw new ForbiddenError("Only system admins can delete users");
  }
  if (user.role === "SYSTEM_ADMIN") {
    throw new ForbiddenError("Cannot delete a system admin");
  }

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.pushToken.deleteMany({ where: { userId: id } });
    await tx.auditLog.deleteMany({ where: { userId: id } });
    await tx.session.deleteMany({ where: { userId: id } });
    await tx.swapRequest.deleteMany({ where: { OR: [{ requesterId: id }, { acceptorId: id }] } });
    await tx.holidayRequest.deleteMany({ where: { userId: id } });
    await tx.shift.updateMany({ where: { userId: id }, data: { userId: null, status: "AVAILABLE" } });
    await tx.user.delete({ where: { id } });
  });
}

export async function resetPassword(id: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
