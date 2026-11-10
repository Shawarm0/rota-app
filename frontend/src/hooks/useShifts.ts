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
    onSuccess: (shift) => {
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["employeeSummaries"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["availableShifts"] });
      toast(shift.userId ? "Additional shift created" : "Open shift created", "success");
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

export function useCrossStoreRequests(enabled: boolean) {
  return useQuery({
    queryKey: ["crossStoreRequests"],
    queryFn: shiftApi.listCrossStoreRequests,
    enabled,
  });
}

export function useDecideCrossStoreRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => shiftApi.decideCrossStoreRequest(id, approve),
    onSuccess: (_, { approve }) => {
      qc.invalidateQueries({ queryKey: ["crossStoreRequests"] });
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["employeeSummaries"] });
      toast(approve ? "Shift approved" : "Shift rejected — it's now open for cover", "success");
    },
    onError: (err: any) => toast(err.response?.data?.error?.message || "Couldn't update the request", "error"),
  });
}
