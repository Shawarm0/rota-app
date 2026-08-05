import { useMutation } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "../components/ui/Toast";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (data) => {
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

  return useMutation({
    mutationFn: () => (refreshToken ? authApi.logout(refreshToken) : Promise.resolve()),
    onSettled: () => {
      logout();
      navigate("/login");
    },
  });
}
