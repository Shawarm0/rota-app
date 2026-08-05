import { useAuthStore } from "../../stores/authStore";
import type { Role } from "../../types";

interface RoleGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
