import prisma from "../lib/db.js";
import { minutesToHours, summariseShifts } from "../lib/shiftHours.js";
import { shiftsAtStores, STAFF_ROLES, type Store } from "../lib/storeScope.js";

// Hours between two dates (inclusive), counted at the store each shift was worked.
// stores: the stores to include, or null for every store.
async function loadReport(businessId: string, from: string, to: string, stores: Store[] | null) {
  const shiftsInRange = {
    date: { gte: new Date(from), lte: new Date(to) },
    rota: { status: "PUBLISHED" as const },
    status: { not: "AVAILABLE" as const },
    // Not counted until their home store manager approves
    crossStoreStatus: { not: "PENDING" as const },
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
      location: { select: { name: true } },
      shifts: {
        where: shiftsInRange,
        select: { status: true, startTime: true, endTime: true, location: true, rota: { select: { location: { select: { name: true } } } } },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
  return employees;
}

export async function getHoursReport(businessId: string, from: string, to: string, stores: Store[] | null) {
  return toRows(await loadReport(businessId, from, to, stores));
}

// Where each shift was worked: its own store, or its rota's
const shiftStore = (shift: { location: string | null; rota: { location: { name: string } | null } }) =>
  shift.location || shift.rota.location?.name || "No store";

function toRows(employees: Awaited<ReturnType<typeof loadReport>>) {
  return employees.map((emp) => {
    const totals = summariseShifts(emp.shifts);
    // Hours per store worked, for staff who split their time between stores
    const storeNames = [...new Set(emp.shifts.map(shiftStore))].sort();
    const stores = storeNames.map((store) => ({
      store,
      hours: minutesToHours(summariseShifts(emp.shifts.filter((s) => shiftStore(s) === store)).totalMinutes),
    }));
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      // Home store; their hours may include cover worked elsewhere
      store: emp.location?.name ?? null,
      totalShifts: totals.rotaShifts + totals.extraShifts,
      rotaHours: minutesToHours(totals.rotaMinutes),
      extraHours: minutesToHours(totals.extraMinutes),
      // Rounded from the exact total, so it can differ from rota + extra by 0.01
      totalHours: minutesToHours(totals.totalMinutes),
      stores,
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
  const header = ["Name", "Home Store", "Total Shifts", "Rota Hours", "Extra Hours", "Total Hours", "Hours by Store"].map(csvField).join(",");
  const rows = data.map((d) =>
    [d.name, d.store ?? "", d.totalShifts, d.rotaHours, d.extraHours, d.totalHours, d.stores.map((s) => `${s.store} ${s.hours}`).join("; ")]
      .map(csvField)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

function toTotals(shifts: { status: string; startTime: string; endTime: string }[]) {
  const totals = summariseShifts(shifts);
  return {
    totalShifts: totals.rotaShifts + totals.extraShifts,
    rotaHours: minutesToHours(totals.rotaMinutes),
    extraHours: minutesToHours(totals.extraMinutes),
    totalHours: minutesToHours(totals.totalMinutes),
  };
}

// The same report plus hours grouped by the store each shift was worked at, and overall totals worked
// out from exact minutes, for the PDF
export async function getHoursReportDetail(businessId: string, from: string, to: string, stores: Store[] | null) {
  const employees = await loadReport(businessId, from, to, stores);
  const allShifts = employees.flatMap((e) => e.shifts);

  const shiftsByStore = new Map<string, typeof allShifts>();
  for (const shift of allShifts) {
    const store = shiftStore(shift);
    const group = shiftsByStore.get(store);
    if (group) group.push(shift);
    else shiftsByStore.set(store, [shift]);
  }
  const byStore = [...shiftsByStore.entries()]
    .map(([store, shifts]) => ({ store, ...toTotals(shifts) }))
    .sort((a, b) => a.store.localeCompare(b.store));

  return { rows: toRows(employees), byStore, totals: toTotals(allShifts) };
}

// Names printed on the PDF
export async function getReportContext(businessId: string, userId: string) {
  const [business, user] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } }),
  ]);
  return { businessName: business?.name ?? "Rota", generatedBy: user ? `${user.firstName} ${user.lastName}` : "" };
}
