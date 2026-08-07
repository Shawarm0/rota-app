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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      const count = Array.isArray(data) ? data.length : 1;
      toast(`${count} holiday request${count > 1 ? "s" : ""} submitted`, "success");
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
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["holidays", "PENDING"] });
      const prev = qc.getQueryData<any[]>(["holidays", "PENDING"]);
      if (prev) {
        qc.setQueryData(["holidays", "PENDING"], prev.filter((h: any) => h.id !== id));
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["holidays", "PENDING"], ctx.prev);
      toast("Failed to approve holiday", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["approvedHolidays"] });
      qc.invalidateQueries({ queryKey: ["availableShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["allShifts"] });
    },
    onSuccess: () => {
      toast("Holiday approved", "success");
    },
  });
}

export function useRejectHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      holidayApi.rejectHoliday(id, reason),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["holidays", "PENDING"] });
      const prev = qc.getQueryData<any[]>(["holidays", "PENDING"]);
      if (prev) {
        qc.setQueryData(["holidays", "PENDING"], prev.filter((h: any) => h.id !== id));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["holidays", "PENDING"], ctx.prev);
      toast("Failed to reject holiday", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onSuccess: () => {
      toast("Holiday rejected", "success");
    },
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { date?: string; reason?: string | null; status?: string } }) =>
      holidayApi.updateHoliday(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["approvedHolidays"] });
      qc.invalidateQueries({ queryKey: ["availableShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Holiday updated", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to update holiday";
      toast(msg, "error");
    },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: holidayApi.deleteHoliday,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["approvedHolidays"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Holiday deleted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to delete holiday";
      toast(msg, "error");
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
