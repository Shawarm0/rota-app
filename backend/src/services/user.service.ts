import { Role } from "@prisma/client";
import prisma from "../lib/db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors.js";

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "MANAGER" | "EMPLOYEE";
  businessId?: string;
  locationId?: string;
}

export async function createUser(input: CreateUserInput, creatorRole: Role, creatorBusinessId: string | null) {
  if (input.role === "MANAGER" && creatorRole !== "SYSTEM_ADMIN") {
    throw new ForbiddenError("Only system admins can create managers");
  }

  if (input.role === "EMPLOYEE" && creatorRole !== "MANAGER") {
    throw new ForbiddenError("Only managers can create employees");
  }

  const businessId = input.role === "EMPLOYEE" ? creatorBusinessId : input.businessId;
  if (!businessId) {
    throw new AppError(400, "Business ID is required");
  }

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
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      businessId: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      active: true,
      createdAt: true,
    },
  });
}

export async function listUsers(businessId: string | null, role?: Role, locationId?: string) {
  return prisma.user.findMany({
    where: {
      ...(businessId ? { businessId } : {}),
      ...(role ? { role } : {}),
      ...(locationId ? { locationId } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      businessId: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      active: true,
      createdAt: true,
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
      businessId: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      active: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function updateUser(id: string, data: { firstName?: string; lastName?: string; email?: string; locationId?: string | null }) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      businessId: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      active: true,
    },
  });
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
