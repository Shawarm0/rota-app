import { useEffect, useState } from "react";
import { toast } from "../components/ui/Toast";
import { disablePush, enablePush, getPushState, type PushState } from "../lib/push";

export function usePushNotifications() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const next = await enablePush();
      setState(next);
      if (next === "enabled") toast("Phone notifications turned on", "success");
      if (next === "denied") toast("Notifications were blocked", "error");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't turn on notifications", "error");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await disablePush();
      setState("disabled");
      toast("Phone notifications turned off", "success");
    } catch {
      toast("Couldn't turn off notifications", "error");
    } finally {
      setBusy(false);
    }
  };

  return { state, busy, enable, disable };
}
