import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as shiftApi from "../api/shift.api";
import { toast } from "../components/ui/Toast";

export function useMyShifts(from?: string, to?: string) {
  return useQuery({
    queryKey: ["myShifts", from, to],
    queryFn: () => shiftApi.getMyShifts(from, to),
  });
}

export function useAllShifts(from?: string, to?: string) {
  return useQuery({
    queryKey: ["allShifts", from, to],
    queryFn: () => shiftApi.getAllShifts(from, to),
  });
}

export function useAvailableShifts() {
  return useQuery({
    queryKey: ["availableShifts"],
    queryFn: shiftApi.getAvailableShifts,
  });
}

export function useRequestCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.requestCover,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      toast(`Cover requested — ${data.notified} employee${data.notified !== 1 ? "s" : ""} notified`, "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to request cover";
      toast(msg, "error");
    },
  });
}

export function useCreateAdditionalShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.createAdditionalShift,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["employeeSummaries"] });
      toast("Additional shift created", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to create shift";
      toast(msg, "error");
    },
  });
}

export function useClaimShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.claimShift,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availableShifts"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      toast("Shift claimed!", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to claim shift";
      toast(msg, "error");
    },
  });
}
