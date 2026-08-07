import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useLogin } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";
import clsx from "clsx";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const theme = useUiStore((s) => s.theme);
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const isCompact = theme === "compact";
  const isModern = theme === "modern";

  return (
    <div className={clsx(
      "flex min-h-screen items-center justify-center px-4",
      isCompact ? "bg-gray-950" :
      isModern ? "bg-gradient-to-br from-indigo-50 to-purple-100" :
      "bg-gradient-to-br from-blue-50 to-indigo-100",
    )}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className={clsx(
            "flex items-center justify-center mb-4",
            isCompact ? "h-12 w-12 rounded-lg bg-violet-600 shadow-lg shadow-violet-900/30" :
            isModern ? "h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200" :
            "h-14 w-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200",
          )}>
            <Clock className={clsx("text-white", isCompact ? "h-6 w-6" : "h-8 w-8")} />
          </div>
          <h1 className={clsx(
            "font-bold",
            isCompact ? "text-xl text-white" :
            isModern ? "text-3xl text-gray-900 tracking-tight" :
            "text-2xl text-gray-900",
          )}>Welcome back</h1>
          <p className={clsx(
            "mt-1",
            isCompact ? "text-sm text-gray-400" : "text-sm text-gray-500",
          )}>Sign in to manage your rota</p>
        </div>

        <div className={clsx(
          "p-6",
          isCompact ? "bg-gray-900 rounded-lg border border-gray-800" :
          isModern ? "bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl" :
          "bg-white rounded-2xl shadow-sm border border-gray-100",
        )}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password", { required: "Password is required" })}
            />
            <Button type="submit" className="w-full" loading={loginMutation.isPending}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
