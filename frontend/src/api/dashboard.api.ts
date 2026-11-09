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

export async function getHoursReport(from: string, to: string): Promise<HoursReportRow[]> {
  const { data } = await client.get<HoursReportRow[]>("/dashboard/reports/hours", { params: { from, to } });
  return data;
}

async function download(path: string, params: Record<string, string>, filename: string) {
  const response = await client.get(path, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCSV(from: string, to: string) {
  await download("/dashboard/reports/export", { from, to }, `report-${from}-${to}.csv`);
}

export async function exportPDF(from: string, to: string) {
  await download("/dashboard/reports/pdf", { from, to }, `hours-report-${from}-${to}.pdf`);
}
