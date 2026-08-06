import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as holidayApi from "../api/holiday.api";
import { toast } from "../components/ui/Toast";

export function useHolidayRequests(status?: string) {
  return useQuery({
    queryKey: ["holidays", status],
    queryFn: () => holidayApi.listHolidayRequests(status),
  });
}

export function useApprovedHolidays(from?: string, to?: string) {
  return useQuery({
    queryKey: ["approvedHolidays", from, to],
    queryFn: () => holidayApi.getApprovedHolidays(from, to),
  });
}

export function useRequestHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: holidayApi.requestHoliday,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      toast("Holiday request submitted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to request holiday";
      toast(msg, "error");
    },
  });
}

export function useApproveHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: holidayApi.approveHoliday,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["availableShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      toast("Holiday approved", "success");
    },
  });
}

export function useRejectHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      holidayApi.rejectHoliday(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      toast("Holiday rejected", "success");
    },
  });
}

export function useCancelHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: holidayApi.cancelHoliday,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      toast("Holiday cancelled", "success");
    },
  });
}
