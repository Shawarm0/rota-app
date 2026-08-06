import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as rotaApi from "../api/rota.api";
import * as shiftApi from "../api/shift.api";
import { toast } from "../components/ui/Toast";
import type { Shift } from "../types";

export function useRotas(status?: string) {
  return useQuery({
    queryKey: ["rotas", status],
    queryFn: () => rotaApi.listRotas(status),
  });
}

export function useRota(id: string | null) {
  return useQuery({
    queryKey: ["rota", id],
    queryFn: () => rotaApi.getRota(id!),
    enabled: !!id,
  });
}

export function useCreateRota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rotaApi.createRota,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotas"] });
      toast("Rota created", "success");
    },
    onError: () => toast("Failed to create rota", "error"),
  });
}

export function usePublishRota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rotaApi.publishRota,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotas"] });
      qc.invalidateQueries({ queryKey: ["rota"] });
      toast("Rota published! Employees have been notified.", "success");
    },
    onError: () => toast("Failed to publish rota", "error"),
  });
}

export function useDeleteRota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rotaApi.deleteRota,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotas"] });
      toast("Rota deleted", "success");
    },
  });
}

export function useCopyRota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStartDate }: { id: string; newStartDate: string }) =>
      rotaApi.copyRota(id, newStartDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotas"] });
      toast("Rota copied", "success");
    },
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rotaId, shift }: { rotaId: string; shift: Partial<Shift> }) =>
      shiftApi.createShift(rotaId, shift),
    onSuccess: (_, { rotaId }) => {
      qc.invalidateQueries({ queryKey: ["rota", rotaId] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to create shift";
      toast(msg, "error");
    },
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Shift> }) =>
      shiftApi.updateShift(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rota"] });
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to update shift";
      toast(msg, "error");
    },
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.deleteShift,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rota"] });
      qc.invalidateQueries({ queryKey: ["allShifts"] });
      qc.invalidateQueries({ queryKey: ["myShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftsToCover"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Shift deleted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to delete shift";
      toast(msg, "error");
    },
  });
}
