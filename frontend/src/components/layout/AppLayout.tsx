import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { PushPrompt } from "./PushPrompt";
import { useAuthStore } from "../../stores/authStore";
import { syncPushSubscription } from "../../lib/push";
import { getMe } from "../../api/auth.api";

export function AppLayout() {
  const userId = useAuthStore((s) => s.user?.id);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!userId) return;
    syncPushSubscription().catch(() => {});
    // Pick up role changes (e.g. promoted to assistant manager) without signing out
    getMe()
      .then((me) => setUser({ ...useAuthStore.getState().user!, ...me }))
      .catch(() => {});
  }, [userId, setUser]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PushPrompt />
        <Outlet />
      </main>
    </div>
  );
}
