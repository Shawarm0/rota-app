import prisma from "../lib/db.js";

export async function getHoursReport(businessId: string, from: string, to: string) {
  const employees = await prisma.user.findMany({
    where: { businessId, role: "EMPLOYEE", active: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      shifts: {
        where: {
          date: { gte: new Date(from), lte: new Date(to) },
          rota: { status: "PUBLISHED" },
          status: { not: "AVAILABLE" },
        },
        select: { startTime: true, endTime: true, date: true, status: true },
      },
    },
  });

  return employees.map((emp) => {
    let totalHours = 0;
    for (const shift of emp.shifts) {
      const [startH, startM] = shift.startTime.split(":").map(Number);
      const [endH, endM] = shift.endTime.split(":").map(Number);
      totalHours += endH - startH + (endM - startM) / 60;
    }
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      totalShifts: emp.shifts.length,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  });
}

export async function exportCSV(businessId: string, from: string, to: string) {
  const data = await getHoursReport(businessId, from, to);
  const header = "Name,Total Shifts,Total Hours";
  const rows = data.map((d) => `"${d.name}",${d.totalShifts},${d.totalHours}`);
  return [header, ...rows].join("\n");
}
