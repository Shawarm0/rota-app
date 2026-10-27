import prisma from "../lib/db.js";
import { minutesToHours, shiftMinutes } from "../lib/shiftHours.js";

export async function getHoursReport(businessId: string, from: string, to: string) {
  const shiftsInRange = {
    date: { gte: new Date(from), lte: new Date(to) },
    rota: { status: "PUBLISHED" as const },
    status: { not: "AVAILABLE" as const },
  };

  // Include people who have since left, otherwise their past hours disappear from the report
  const employees = await prisma.user.findMany({
    where: { businessId, role: "EMPLOYEE", OR: [{ active: true }, { shifts: { some: shiftsInRange } }] },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      shifts: {
        where: shiftsInRange,
        select: { startTime: true, endTime: true },
      },
    },
  });

  return employees.map((emp) => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    totalShifts: emp.shifts.length,
    totalHours: minutesToHours(emp.shifts.reduce((sum, s) => sum + shiftMinutes(s.startTime, s.endTime), 0)),
  }));
}

export async function exportCSV(businessId: string, from: string, to: string) {
  const data = await getHoursReport(businessId, from, to);
  const header = "Name,Total Shifts,Total Hours";
  const rows = data.map((d) => `"${d.name}",${d.totalShifts},${d.totalHours}`);
  return [header, ...rows].join("\n");
}
