import prisma from "../lib/db.js";
import { summariseShifts, weekBounds } from "../lib/shiftHours.js";
import { shiftsAtStores, STAFF_ROLES, type Store } from "../lib/storeScope.js";

// stores: the stores this person can see, or null for every store
export async function getDashboardData(businessId: string, stores: Store[] | null) {
  const staffAt = stores ? { locationId: { in: stores.map((s) => s.id) } } : {};
  const [pendingHolidays, shiftsNeedingCover, totalEmployees, recentActivity] =
    await Promise.all([
      prisma.holidayRequest.count({
        where: { user: { businessId, ...staffAt }, status: "PENDING" },
      }),
      prisma.shift.count({
        where: {
          rota: { businessId, status: "PUBLISHED" },
          status: "AVAILABLE",
          date: { gte: new Date() },
          ...(stores ? { AND: [shiftsAtStores(stores)] } : {}),
        },
      }),
      prisma.user.count({
        where: { businessId, role: { in: STAFF_ROLES }, active: true, ...staffAt },
      }),
      prisma.auditLog.findMany({
        // Store managers see activity by people at the stores they can see
        where: { user: { businessId, ...staffAt } },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  return {
    pendingHolidays,
    shiftsNeedingCover,
    totalEmployees,
    recentActivity,
  };
}

export async function getShiftsToCover(businessId: string, stores?: Store[] | null) {
  return prisma.shift.findMany({
    where: {
      rota: { businessId, status: "PUBLISHED" },
      status: "AVAILABLE",
      ...(stores ? { AND: [shiftsAtStores(stores)] } : {}),
      date: { gte: new Date() },
    },
    include: {
      rota: { select: { id: true, name: true, location: { select: { name: true } } } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getStaffingOverview(businessId: string, weekStart: string, stores: Store[] | null) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const shifts = await prisma.shift.findMany({
    where: {
      rota: { businessId, status: "PUBLISHED" },
      date: { gte: start, lt: end },
      status: { not: "AVAILABLE" },
      ...(stores ? { AND: [shiftsAtStores(stores)] } : {}),
    },
    select: { date: true, userId: true },
  });

  const days: Record<string, number> = {};
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    days[d.toISOString().split("T")[0]] = 0;
  }
  for (const shift of shifts) {
    const key = shift.date.toISOString().split("T")[0];
    if (key in days) days[key]++;
  }

  return Object.entries(days).map(([date, count]) => ({ date, shiftCount: count }));
}

// Hours for a week, counted at the store each shift was worked (not the person's home store).
// stores: the stores to include, or null for every store.
export async function getEmployeeSummaries(businessId: string, weekStart: string, stores: Store[] | null) {
  const { start, end } = weekBounds(weekStart);
  const weekShifts = {
    date: { gte: start, lt: end },
    rota: { status: "PUBLISHED" as const },
    status: { not: "AVAILABLE" as const },
    // Not counted until their home store manager approves
    crossStoreStatus: { not: "PENDING" as const },
    ...(stores ? { AND: [shiftsAtStores(stores)] } : {}),
  };

  // The stores' active staff, plus anyone who worked there this week (cover from another store, or
  // someone who has since been disabled)
  const employees = await prisma.user.findMany({
    where: {
      businessId,
      role: { in: STAFF_ROLES },
      OR: [
        { active: true, ...(stores ? { locationId: { in: stores.map((s) => s.id) } } : {}) },
        { shifts: { some: weekShifts } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      locationId: true,
      shifts: {
        where: weekShifts,
        select: { status: true, startTime: true, endTime: true },
      },
      holidayRequests: {
        where: { status: "APPROVED", date: { gte: start, lt: end } },
        select: { id: true },
      },
    },
  });

  return employees.map((emp) => {
    const totals = summariseShifts(emp.shifts);
    // Unrounded so totals add up exactly; the dashboard rounds for display
    return {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      locationId: emp.locationId,
      totalShifts: totals.rotaShifts + totals.extraShifts,
      totalHours: totals.rotaMinutes / 60,
      assignedCount: totals.rotaShifts,
      additionalCount: totals.extraShifts,
      additionalHours: totals.extraMinutes / 60,
      // Approved holiday days in this week
      holidaysUsed: emp.holidayRequests.length,
    };
  });
}
