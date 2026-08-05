import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as swapApi from "../api/swap.api";
import { toast } from "../components/ui/Toast";

export function useSwapRequests(status?: string) {
  return useQuery({
    queryKey: ["swaps", status],
    queryFn: () => swapApi.listSwapRequests(status),
  });
}

export function useRequestSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: swapApi.requestSwap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["swaps"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      toast("Swap request submitted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to request swap";
      toast(msg, "error");
    },
  });
}

export function useAcceptSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: swapApi.acceptSwap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["swaps"] });
      qc.invalidateQueries({ queryKey: ["availableShifts"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      toast("Swap accepted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to accept swap";
      toast(msg, "error");
    },
  });
}

export function useApproveSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: swapApi.approveSwap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["swaps"] });
      toast("Swap approved", "success");
    },
  });
}

export function useRejectSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: swapApi.rejectSwap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["swaps"] });
      toast("Swap rejected", "success");
    },
  });
}

export function useCancelSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: swapApi.cancelSwap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["swaps"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      toast("Swap cancelled", "success");
    },
  });
}
