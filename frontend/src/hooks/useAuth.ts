import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "../components/ui/Toast";
import { disablePush } from "../lib/push";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (data) => {
      queryClient.clear();
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate("/dashboard");
    },
    onError: () => {
      toast("Invalid email or password", "error");
    },
  });
}

export function useLogout() {
  const { refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Stop this device receiving the signed-out user's notifications
      await disablePush().catch(() => {});
      if (refreshToken) await authApi.logout(refreshToken);
    },
    onSettled: () => {
      queryClient.clear();
      logout();
      navigate("/login");
    },
  });
}
