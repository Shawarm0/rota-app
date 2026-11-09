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
