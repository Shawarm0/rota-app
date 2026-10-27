import { useAuthStore } from "../stores/authStore";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === "MANAGER" || user?.role === "SYSTEM_ADMIN";
  const isAssistantManager = user?.role === "EMPLOYEE" && Boolean(user.isAssistantManager);

  return {
    isManager,
    isAssistantManager,
    // Can see the whole team's shifts, manage employees, cover, reports and holiday approvals
    canManageStaff: isManager || isAssistantManager,
  };
}
