import prisma from "../lib/db.js";
import { shiftMinutes, weekBounds } from "../lib/shiftHours.js";

export async function getDashboardData(businessId: string) {
  const [pendingHolidays, shiftsNeedingCover, totalEmployees, recentActivity] =
    await Promise.all([
      prisma.holidayRequest.count({
        where: { user: { businessId }, status: "PENDING" },
      }),
      prisma.shift.count({
        where: { rota: { businessId, status: "PUBLISHED" }, status: "AVAILABLE", date: { gte: new Date() } },
      }),
      prisma.user.count({
        where: { businessId, role: "EMPLOYEE", active: true },
      }),
      prisma.auditLog.findMany({
        where: { user: { businessId } },
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

export async function getShiftsToCover(businessId: string) {
  return prisma.shift.findMany({
    where: {
      rota: { businessId, status: "PUBLISHED" },
      status: "AVAILABLE",
      date: { gte: new Date() },
    },
    include: {
      rota: { select: { id: true, name: true, location: { select: { name: true } } } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getStaffingOverview(businessId: string, weekStart: string) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const shifts = await prisma.shift.findMany({
    where: {
      rota: { businessId, status: "PUBLISHED" },
      date: { gte: start, lt: end },
      status: { not: "AVAILABLE" },
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

export async function getEmployeeSummaries(businessId: string, weekStart: string) {
  const { start, end } = weekBounds(weekStart);
  const weekShifts = {
    date: { gte: start, lt: end },
    rota: { status: "PUBLISHED" as const },
    status: { not: "AVAILABLE" as const },
  };

  // Anyone who worked this week counts towards it, even if they've since been disabled
  const employees = await prisma.user.findMany({
    where: { businessId, role: "EMPLOYEE", OR: [{ active: true }, { shifts: { some: weekShifts } }] },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      shifts: {
        where: weekShifts,
        select: { status: true, startTime: true, endTime: true },
      },
      holidayRequests: {
        where: { status: "APPROVED" },
        select: { id: true },
      },
    },
  });

  return employees.map((emp) => {
    let assignedMinutes = 0;
    let assignedCount = 0;
    let additionalCount = 0;
    let additionalMinutes = 0;

    for (const shift of emp.shifts) {
      const minutes = shiftMinutes(shift.startTime, shift.endTime);
      if (shift.status === "ASSIGNED") {
        assignedCount++;
        assignedMinutes += minutes;
      } else if (shift.status === "ADDITIONAL") {
        additionalCount++;
        additionalMinutes += minutes;
      }
    }

    // Unrounded so totals add up exactly; the dashboard rounds for display
    return {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      totalShifts: emp.shifts.length,
      totalHours: assignedMinutes / 60,
      assignedCount,
      additionalCount,
      additionalHours: additionalMinutes / 60,
      holidaysUsed: emp.holidayRequests.length,
    };
  });
}
