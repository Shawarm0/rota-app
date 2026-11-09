import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { PushPrompt } from "./PushPrompt";
import { useAuthStore } from "../../stores/authStore";
import { syncPushSubscription } from "../../lib/push";
import { getMe } from "../../api/auth.api";

export function AppLayout() {
  const userId = useAuthStore((s) => s.user?.id);
  const setUser = useAuthStore((s) => s.setUser);
  const role = useAuthStore((s) => s.user?.role);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!userId) return;
    syncPushSubscription().catch(() => {});
    // Pick up role changes (e.g. promoted to assistant manager) without signing out
    getMe()
      .then((me) => setUser({ ...useAuthStore.getState().user!, ...me }))
      .catch(() => {});
  }, [userId, setUser]);

  // The system admin only uses the admin screen and settings; nobody else can open the admin screen
  const isSystemAdmin = role === "SYSTEM_ADMIN";
  if (isSystemAdmin && pathname !== "/admin" && pathname !== "/settings") return <Navigate to="/admin" replace />;
  if (!isSystemAdmin && pathname === "/admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {!isSystemAdmin && <PushPrompt />}
        <Outlet />
      </main>
    </div>
  );
}
