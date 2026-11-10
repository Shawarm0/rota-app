import client from "./client";

export interface DashboardData {
  pendingHolidays: number;
  shiftsNeedingCover: number;
  totalEmployees: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: Record<string, unknown> | null;
    createdAt: string;
    user: { firstName: string; lastName: string };
  }>;
}

export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  locationId: string | null;
  totalShifts: number;
  totalHours: number;
  assignedCount: number;
  additionalCount: number;
  additionalHours: number;
  holidaysUsed: number;
}

export interface StaffingDay {
  date: string;
  shiftCount: number;
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await client.get<DashboardData>("/dashboard");
  return data;
}

export interface ShiftToCover {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  rota: { id: string; name: string | null; location: { name: string } | null };
}

export async function getShiftsToCover(): Promise<ShiftToCover[]> {
  const { data } = await client.get<ShiftToCover[]>("/dashboard/shifts-to-cover");
  return data;
}

export async function getStaffing(weekStart: string): Promise<StaffingDay[]> {
  const { data } = await client.get<StaffingDay[]>("/dashboard/staffing", { params: { weekStart } });
  return data;
}

// storeId: count only shifts worked at this store (empty for every store you can see)
export async function getEmployeeSummaries(weekStart: string, storeId?: string): Promise<EmployeeSummary[]> {
  const { data } = await client.get<EmployeeSummary[]>("/dashboard/employees", {
    params: { weekStart, storeId: storeId || undefined },
  });
  return data;
}

export interface HoursReportRow {
  id: string;
  name: string;
  totalShifts: number;
  rotaHours: number;
  extraHours: number;
  totalHours: number;
}

// storeId: only shifts worked at this store (empty for every store you can see)
export async function getHoursReport(from: string, to: string, storeId?: string): Promise<HoursReportRow[]> {
  const { data } = await client.get<HoursReportRow[]>("/dashboard/reports/hours", {
    params: { from, to, storeId: storeId || undefined },
  });
  return data;
}

async function download(path: string, params: Record<string, string | undefined>, filename: string) {
  const response = await client.get(path, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Freed after a moment: some browsers (e.g. older Safari) cancel the download if it's revoked straight away
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// Adds the store to the file name, e.g. hours-report-euxton-2026-11-01-2026-11-30.pdf
function reportFileName(prefix: string, from: string, to: string, storeName: string | undefined, ext: string) {
  const store = storeName ? `-${storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : "";
  return `${prefix}${store}-${from}-${to}.${ext}`;
}

export async function exportCSV(from: string, to: string, store?: { id: string; name: string }) {
  await download("/dashboard/reports/export", { from, to, storeId: store?.id }, reportFileName("report", from, to, store?.name, "csv"));
}

export async function exportPDF(from: string, to: string, store?: { id: string; name: string }) {
  await download("/dashboard/reports/pdf", { from, to, storeId: store?.id }, reportFileName("hours-report", from, to, store?.name, "pdf"));
}
