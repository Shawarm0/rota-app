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
    createdAt: string;
    user: { firstName: string; lastName: string };
  }>;
}

export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalShifts: number;
  totalHours: number;
  assignedCount: number;
  additionalCount: number;
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

export async function getStaffing(weekStart: string): Promise<StaffingDay[]> {
  const { data } = await client.get<StaffingDay[]>("/dashboard/staffing", { params: { weekStart } });
  return data;
}

export async function getEmployeeSummaries(): Promise<EmployeeSummary[]> {
  const { data } = await client.get<EmployeeSummary[]>("/dashboard/employees");
  return data;
}

export async function getHoursReport(from: string, to: string) {
  const { data } = await client.get("/dashboard/reports/hours", { params: { from, to } });
  return data;
}

export async function exportCSV(from: string, to: string) {
  const response = await client.get("/dashboard/reports/export", {
    params: { from, to },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${from}-${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
