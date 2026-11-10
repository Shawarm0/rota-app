import prisma from "../lib/db.js";
import { hashPassword } from "../lib/password.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";

export async function listBusinesses() {
  return prisma.business.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      locations: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      users: {
        where: { role: "OWNER" },
        select: { id: true, firstName: true, lastName: true, email: true, active: true },
      },
      _count: { select: { users: true } },
    },
  });
}

// A new business always starts with an owner, who then sets up stores and staff
export async function createBusiness(data: {
  name: string;
  owner: { email: string; password: string; firstName: string; lastName: string };
}) {
  if (await prisma.user.findUnique({ where: { email: data.owner.email } })) {
    throw new ConflictError("Someone already uses that email");
  }
  const passwordHash = await hashPassword(data.owner.password);
  return prisma.business.create({
    data: {
      name: data.name,
      users: {
        create: {
          email: data.owner.email,
          passwordHash,
          firstName: data.owner.firstName,
          lastName: data.owner.lastName,
          role: "OWNER",
        },
      },
    },
    select: { id: true, name: true },
  });
}

const ACTIVITY_LIMIT = 200;

async function assertBusinessExists(businessId: string) {
  if (!(await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } }))) {
    throw new NotFoundError("Business");
  }
}

// The business's activity log (what its managers see as Recent Activity), newest first
export async function listActivity(businessId: string) {
  await assertBusinessExists(businessId);
  const where = { user: { businessId } };
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_LIMIT,
    }),
  ]);
  return { total, items };
}

// Deletes the chosen entries, or the whole log when no ids are given. Only ever touches this business's entries.
export async function deleteActivity(businessId: string, ids?: string[]) {
  await assertBusinessExists(businessId);
  const { count } = await prisma.auditLog.deleteMany({
    where: { user: { businessId }, ...(ids ? { id: { in: ids } } : {}) },
  });
  return { deleted: count };
}
