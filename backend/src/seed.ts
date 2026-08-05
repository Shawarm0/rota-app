import prisma from "./lib/db.js";
import { hashPassword } from "./lib/password.js";

async function main() {
  const hash = await hashPassword("password123");

  const business = await prisma.business.upsert({
    where: { id: "demo-business" },
    update: {},
    create: {
      id: "demo-business",
      name: "Demo Business",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@rota.app" },
    update: {},
    create: {
      email: "admin@rota.app",
      passwordHash: hash,
      firstName: "System",
      lastName: "Admin",
      role: "SYSTEM_ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@rota.app" },
    update: {},
    create: {
      email: "manager@rota.app",
      passwordHash: hash,
      firstName: "Jane",
      lastName: "Manager",
      role: "MANAGER",
      businessId: business.id,
    },
  });

  const employees = [
    { email: "alice@rota.app", firstName: "Alice", lastName: "Smith" },
    { email: "bob@rota.app", firstName: "Bob", lastName: "Jones" },
    { email: "charlie@rota.app", firstName: "Charlie", lastName: "Brown" },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        ...emp,
        passwordHash: hash,
        role: "EMPLOYEE",
        businessId: business.id,
      },
    });
  }

  console.log("Seed completed. All users have password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
