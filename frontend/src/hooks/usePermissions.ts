import { useAuthStore } from "../stores/authStore";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === "MANAGER" || user?.role === "SYSTEM_ADMIN";
  const isAssistantManager = user?.role === "EMPLOYEE" && Boolean(user.isAssistantManager);
  // Assistant managers with a store can only change shifts there; without one they cover every store
  const restrictedStore = isAssistantManager ? (user?.location?.name ?? null) : null;

  return {
    isManager,
    isAssistantManager,
    // Can see the whole team's shifts, manage employees, cover, reports and holiday approvals
    canManageStaff: isManager || isAssistantManager,
    restrictedStore,
    canEditStore: (store: string | null | undefined) => !restrictedStore || store === restrictedStore,
  };
}
