import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from "../api/dashboard.api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.getDashboard,
  });
}

export function useShiftsToCover() {
  return useQuery({
    queryKey: ["shiftsToCover"],
    queryFn: dashboardApi.getShiftsToCover,
  });
}

export function useStaffing(weekStart: string) {
  return useQuery({
    queryKey: ["staffing", weekStart],
    queryFn: () => dashboardApi.getStaffing(weekStart),
    enabled: !!weekStart,
  });
}

export function useEmployeeSummaries() {
  return useQuery({
    queryKey: ["employeeSummaries"],
    queryFn: dashboardApi.getEmployeeSummaries,
  });
}
