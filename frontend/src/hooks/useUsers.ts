import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as userApi from "../api/user.api";
import { toast } from "../components/ui/Toast";

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ["users", role],
    queryFn: () => userApi.listUsers(role),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast("Employee created", "success");
    },
    onError: () => toast("Failed to create employee", "error"),
  });
}

export function useDisableUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.disableUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast("User disabled", "success");
    },
  });
}

export function useEnableUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.enableUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast("User enabled", "success");
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      userApi.resetPassword(id, newPassword),
    onSuccess: () => toast("Password reset", "success"),
    onError: () => toast("Failed to reset password", "error"),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(currentPassword, newPassword),
    onSuccess: () => toast("Password changed", "success"),
    onError: () => toast("Failed to change password", "error"),
  });
}
