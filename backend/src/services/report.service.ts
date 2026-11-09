import prisma from "../lib/db.js";
import { minutesToHours, summariseShifts } from "../lib/shiftHours.js";
import { shiftsAtStores, STAFF_ROLES, type Store } from "../lib/storeScope.js";

// Hours between two dates (inclusive), counted at the store each shift was worked.
// stores: the stores to include, or null for every store.
export async function getHoursReport(businessId: string, from: string, to: string, stores: Store[] | null) {
  const shiftsInRange = {
    date: { gte: new Date(from), lte: new Date(to) },
    rota: { status: "PUBLISHED" as const },
    status: { not: "AVAILABLE" as const },
    ...(stores ? { AND: [shiftsAtStores(stores)] } : {}),
  };

  // The stores' active staff, plus anyone who worked there in the period (cover from another store, or
  // people who have since left, whose past hours would otherwise disappear)
  const employees = await prisma.user.findMany({
    where: {
      businessId,
      role: { in: STAFF_ROLES },
      OR: [
        { active: true, ...(stores ? { locationId: { in: stores.map((s) => s.id) } } : {}) },
        { shifts: { some: shiftsInRange } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      shifts: {
        where: shiftsInRange,
        select: { status: true, startTime: true, endTime: true },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return employees.map((emp) => {
    const totals = summariseShifts(emp.shifts);
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      totalShifts: totals.rotaShifts + totals.extraShifts,
      rotaHours: minutesToHours(totals.rotaMinutes),
      extraHours: minutesToHours(totals.extraMinutes),
      // Rounded from the exact total, so it can differ from rota + extra by 0.01
      totalHours: minutesToHours(totals.totalMinutes),
    };
  });
}

function csvField(value: string | number) {
  const text = String(value);
  // Quote everything with quotes doubled; prefix formula-like text so spreadsheets don't run it
  return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
}

export async function exportCSV(businessId: string, from: string, to: string, stores: Store[] | null) {
  const data = await getHoursReport(businessId, from, to, stores);
  const header = ["Name", "Total Shifts", "Rota Hours", "Extra Hours", "Total Hours"].map(csvField).join(",");
  const rows = data.map((d) => [d.name, d.totalShifts, d.rotaHours, d.extraHours, d.totalHours].map(csvField).join(","));
  return [header, ...rows].join("\n");
}
