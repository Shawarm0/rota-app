import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as templateApi from "../api/shiftTemplate.api";
import { toast } from "../components/ui/Toast";
import { usePermissions } from "./usePermissions";

export function useShiftTemplates() {
  const { canManageStaff } = usePermissions();
  return useQuery({
    queryKey: ["shiftTemplates"],
    queryFn: templateApi.listShiftTemplates,
    enabled: canManageStaff,
  });
}

function useTemplateMutation<T>(fn: (input: T) => Promise<unknown>, success: string, failure: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shiftTemplates"] });
      toast(success, "success");
    },
    onError: (err: any) => toast(err.response?.data?.error?.message || failure, "error"),
  });
}

export function useCreateShiftTemplate() {
  return useTemplateMutation(templateApi.createShiftTemplate, "Template created", "Failed to create template");
}

export function useUpdateShiftTemplate() {
  return useTemplateMutation(
    ({ id, data }: { id: string; data: templateApi.ShiftTemplateInput }) => templateApi.updateShiftTemplate(id, data),
    "Template updated",
    "Failed to update template",
  );
}

export function useDeleteShiftTemplate() {
  return useTemplateMutation(templateApi.deleteShiftTemplate, "Template deleted", "Failed to delete template");
}
