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

export function useClaimShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.claimShift,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availableShifts"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      toast("Shift claimed!", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to claim shift";
      toast(msg, "error");
    },
  });
}
