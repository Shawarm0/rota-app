import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as businessApi from "../api/business.api";
import { toast } from "../components/ui/Toast";

export function useBusinesses() {
  return useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.listBusinesses,
  });
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: businessApi.createBusiness,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businesses"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast("Business created", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to create business";
      toast(msg, "error");
    },
  });
}

export function useBusinessActivity(businessId: string | null) {
  return useQuery({
    queryKey: ["business-activity", businessId],
    queryFn: () => businessApi.listActivity(businessId!),
    enabled: !!businessId,
    staleTime: 0,
  });
}

export function useDeleteBusinessActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId, ids }: { businessId: string; ids?: string[] }) => businessApi.deleteActivity(businessId, ids),
    onSuccess: ({ deleted }) => {
      qc.invalidateQueries({ queryKey: ["business-activity"] });
      toast(`Deleted ${deleted} ${deleted === 1 ? "entry" : "entries"}`, "success");
    },
    onError: (err: any) => {
      toast(err.response?.data?.error?.message || "Failed to delete activity", "error");
    },
  });
}
