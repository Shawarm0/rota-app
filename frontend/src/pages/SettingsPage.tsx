import { useForm } from "react-hook-form";
import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";
import { useChangePassword } from "../hooks/useUsers";
import { useLogout } from "../hooks/useAuth";
import { THEME_LABELS, THEME_DESCRIPTIONS } from "../lib/themes";
import type { Theme } from "../lib/themes";
import { Check } from "lucide-react";
import clsx from "clsx";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const themes: Theme[] = ["classic", "compact", "modern"];

const themePreview: Record<Theme, { accent: string; bg: string; border: string }> = {
  classic: { accent: "bg-blue-600", bg: "bg-gray-50", border: "border-blue-600" },
  compact: { accent: "bg-violet-600", bg: "bg-white", border: "border-violet-600" },
  modern: { accent: "bg-indigo-500", bg: "bg-[#F5F5F7]", border: "border-indigo-500" },
};

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useUiStore();
  const changePassword = useChangePassword();
  const logoutMutation = useLogout();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordForm>();

  const onSubmit = (data: PasswordForm) => {
    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      { onSuccess: () => reset() },
    );
  };

  return (
    <>
      <TopBar title="Settings" />
      <div className="p-4 md:p-6 space-y-4 max-w-lg">
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Profile</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Name:</span>{" "}
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            </p>
            <p>
              <span className="text-gray-500">Email:</span>{" "}
              <span className="font-medium">{user?.email}</span>
            </p>
            <p>
              <span className="text-gray-500">Role:</span>{" "}
              <Badge variant="blue">{user?.role?.replace("_", " ")}</Badge>
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Appearance</h3>
          <div className="grid gap-3">
            {themes.map((t) => {
              const preview = themePreview[t];
              const selected = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={clsx(
                    "relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    selected ? preview.border : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={clsx("w-10 h-14 rounded-lg overflow-hidden border border-gray-200 shadow-sm", preview.bg)}>
                      <div className={clsx("h-2", preview.accent)} />
                      <div className="p-1 space-y-1">
                        <div className="h-1.5 w-full rounded bg-gray-300" />
                        <div className="h-1.5 w-3/4 rounded bg-gray-200" />
                        <div className="h-1.5 w-1/2 rounded bg-gray-200" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{THEME_LABELS[t]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{THEME_DESCRIPTIONS[t]}</p>
                  </div>
                  {selected && (
                    <div className={clsx("flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-white", preview.accent)}>
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Change Password</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input
              id="currentPassword"
              label="Current Password"
              type="password"
              error={errors.currentPassword?.message}
              {...register("currentPassword", { required: "Required" })}
            />
            <Input
              id="newPassword"
              label="New Password"
              type="password"
              error={errors.newPassword?.message}
              {...register("newPassword", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })}
            />
            <Input
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Required",
                validate: (v) => v === watch("newPassword") || "Passwords don't match",
              })}
            />
            <Button type="submit" size="sm" loading={changePassword.isPending}>
              Update Password
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Account</h3>
          <Button variant="danger" size="sm" onClick={() => logoutMutation.mutate()}>
            Sign Out
          </Button>
        </Card>
      </div>
    </>
  );
}
