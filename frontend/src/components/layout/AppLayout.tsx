import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { PushPrompt } from "./PushPrompt";
import { useAuthStore } from "../../stores/authStore";
import { syncPushSubscription } from "../../lib/push";

export function AppLayout() {
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (userId) syncPushSubscription().catch(() => {});
  }, [userId]);

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
