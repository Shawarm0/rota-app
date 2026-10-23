import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useAuthStore } from "../stores/authStore";
import { useChangePassword } from "../hooks/useUsers";
import { useLogout } from "../hooks/useAuth";
import { toast } from "../components/ui/Toast";
import { disablePush, enablePush, getPushState, type PushState } from "../lib/push";

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

        <PushNotificationsCard />

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

function PushNotificationsCard() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"));
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (state === "enabled") {
        await disablePush();
        setState("disabled");
        toast("Phone notifications turned off", "success");
      } else {
        const next = await enablePush();
        setState(next);
        if (next === "enabled") toast("Phone notifications turned on", "success");
      }
    } catch {
      toast("Couldn't change notification settings", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3 className="text-xs font-semibold text-gray-900 mb-1">Phone Notifications</h3>
      <p className="text-[13px] text-gray-500 mb-3">
        Get alerts on this device when a rota is published, a shift needs cover, or a request you're involved in changes.
      </p>
      {state === "needs-install" && (
        <p className="text-[13px] text-gray-700">
          On iPhone, tap the <span className="font-medium">Share</span> button in Safari, choose{" "}
          <span className="font-medium">Add to Home Screen</span>, then open the app from your home screen and come back here.
        </p>
      )}
      {state === "unsupported" && (
        <p className="text-[13px] text-gray-700">This browser doesn't support notifications.</p>
      )}
      {state === "denied" && (
        <p className="text-[13px] text-gray-700">
          Notifications are blocked. Allow them for this app in your phone's settings, then reopen the app.
        </p>
      )}
      {(state === "enabled" || state === "disabled") && (
        <Button size="sm" variant={state === "enabled" ? "secondary" : "primary"} loading={busy} onClick={toggle}>
          {state === "enabled" ? "Turn Off" : "Turn On"}
        </Button>
      )}
    </Card>
  );
}
