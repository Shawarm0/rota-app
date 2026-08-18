import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as categoryApi from "../api/category.api";
import { toast } from "../components/ui/Toast";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.listCategories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast("Category created", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to create category";
      toast(msg, "error");
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      categoryApi.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast("Category updated", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to update category";
      toast(msg, "error");
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast("Category deleted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to delete category";
      toast(msg, "error");
    },
  });
}
