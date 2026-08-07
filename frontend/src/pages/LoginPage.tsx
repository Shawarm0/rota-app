import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useLogin } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-lg bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-200">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-[13px] text-gray-500 mt-1">Sign in to manage your rota</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
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
