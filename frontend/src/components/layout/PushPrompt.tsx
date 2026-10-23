import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "../ui/Button";
import { usePushNotifications } from "../../hooks/usePushNotifications";

const DISMISS_KEY = "pushPromptDismissed";

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

export function PushPrompt() {
  const { state, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(wasDismissed);

  if (dismissed || (state !== "disabled" && state !== "needs-install")) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div className="flex items-start gap-2 bg-indigo-50 border-b border-indigo-100 px-3 py-2 text-[13px] text-indigo-900">
      <Bell className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        {state === "disabled" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span>Get notified when your rota is published or a shift needs cover.</span>
            <Button size="sm" loading={busy} onClick={enable}>
              Turn On
            </Button>
          </div>
        ) : (
          <span>
            To get notifications, tap <span className="font-medium">Share</span> then{" "}
            <span className="font-medium">Add to Home Screen</span>, and open the app from there.
          </span>
        )}
      </div>
      <button onClick={dismiss} className="p-0.5 text-indigo-400 hover:text-indigo-600" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
