import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as locationApi from "../api/location.api";
import { toast } from "../components/ui/Toast";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: locationApi.listLocations,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: locationApi.createLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast("Location created", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to create location";
      toast(msg, "error");
    },
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      locationApi.updateLocation(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast("Location updated", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to update location";
      toast(msg, "error");
    },
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: locationApi.deleteLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast("Location deleted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to delete location";
      toast(msg, "error");
    },
  });
}
