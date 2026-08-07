import { useForm } from "react-hook-form";
import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useAuthStore } from "../stores/authStore";
import { useChangePassword } from "../hooks/useUsers";
import { useLogout } from "../hooks/useAuth";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
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
      <div className="p-3 md:p-4 space-y-3 max-w-lg">
        <Card>
          <h3 className="text-xs font-semibold text-gray-900 mb-3">Profile</h3>
          <div className="space-y-2 text-[13px]">
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
              <Badge variant="purple">{user?.role?.replace("_", " ")}</Badge>
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="text-xs font-semibold text-gray-900 mb-3">Change Password</h3>
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
          <h3 className="text-xs font-semibold text-gray-900 mb-3">Account</h3>
          <Button variant="danger" size="sm" onClick={() => logoutMutation.mutate()}>
            Sign Out
          </Button>
        </Card>
      </div>
    </>
  );
}
