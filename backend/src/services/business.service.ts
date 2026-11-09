import prisma from "../lib/db.js";
import { hashPassword } from "../lib/password.js";
import { ConflictError } from "../lib/errors.js";

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
