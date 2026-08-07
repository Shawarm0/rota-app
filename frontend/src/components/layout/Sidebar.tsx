import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  ShoppingBag,
  Palmtree,
  Bell,
  Settings,
  Users,
  CalendarPlus,
  BarChart3,
  AlertCircle,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useUiStore } from "../../stores/uiStore";
import { useLogout } from "../../hooks/useAuth";
import { RoleGate } from "../auth/RoleGate";
import clsx from "clsx";

function useNavLinkClass() {
  const theme = useUiStore((s) => s.theme);
  return ({ isActive }: { isActive: boolean }) => {
    if (theme === "compact") {
      return clsx(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
        isActive ? "bg-violet-500/10 text-violet-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200",
      );
    }
    if (theme === "modern") {
      return clsx(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
      );
    }
    return clsx(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    );
  };
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const logoutMutation = useLogout();
  const navLinkClass = useNavLinkClass();

  const isCompact = theme === "compact";
  const isModern = theme === "modern";

  const sidebarClass = clsx(
    "flex h-screen flex-col border-r",
    isCompact ? "w-56 bg-gray-950 border-gray-800" :
    isModern ? "w-64 bg-white/80 backdrop-blur-lg" :
    "w-64 bg-white",
  );

  const iconSize = isCompact ? "h-4 w-4" : "h-5 w-5";

  const sectionLabel = clsx(
    "uppercase tracking-wider",
    isCompact ? "px-2 text-[11px] font-semibold text-gray-500" :
    isModern ? "px-3 text-[11px] font-semibold text-gray-400" :
    "px-3 text-xs font-semibold text-gray-400",
  );

  const logoutBtnClass = clsx(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isCompact ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200 gap-2.5 rounded-md px-2 py-1.5 text-[13px]" :
    isModern ? "text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-xl px-3 py-2.5" :
    "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  );

  return (
    <aside className={sidebarClass}>
      <div className={clsx(
        "flex items-center gap-2 px-5 py-4 border-b",
        isCompact ? "border-gray-800 px-4 py-3" : isModern ? "border-gray-100" : "",
      )}>
        <div className={clsx(
          "flex items-center justify-center",
          isCompact ? "h-7 w-7 rounded-md bg-violet-600" :
          isModern ? "h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600" :
          "h-8 w-8 rounded-lg bg-blue-600",
        )}>
          <Clock className={clsx("text-white", isCompact ? "h-4 w-4" : "h-5 w-5")} />
        </div>
        <span className={clsx(
          "font-bold",
          isCompact ? "text-base text-white" :
          isModern ? "text-lg text-gray-900 tracking-tight" :
          "text-lg text-gray-900",
        )}>Rota</span>
      </div>

      <nav className={clsx(
        "flex-1 overflow-y-auto space-y-0.5",
        isCompact ? "px-2 py-3" : isModern ? "px-3 py-5 space-y-1" : "px-3 py-4 space-y-1",
      )}>
        <NavLink to="/dashboard" className={navLinkClass}><LayoutDashboard className={iconSize} />Dashboard</NavLink>
        <NavLink to="/calendar" className={navLinkClass}><Calendar className={iconSize} />Calendar</NavLink>
        <NavLink to="/my-shifts" className={navLinkClass}><Clock className={iconSize} />My Shifts</NavLink>
        <NavLink to="/shift-pot" className={navLinkClass}><ShoppingBag className={iconSize} />Shift Pot</NavLink>
        <NavLink to="/holidays" className={navLinkClass}><Palmtree className={iconSize} />Holidays</NavLink>
        <NavLink to="/notifications" className={navLinkClass}><Bell className={iconSize} />Notifications</NavLink>

        <RoleGate allowedRoles={["MANAGER"]}>
          <div className={isCompact ? "pt-3 pb-1" : "pt-4 pb-2"}>
            <p className={sectionLabel}>Manager</p>
          </div>
          <NavLink to="/manager" className={navLinkClass}><LayoutDashboard className={iconSize} />Manager Dashboard</NavLink>
          <NavLink to="/manager/employees" className={navLinkClass}><Users className={iconSize} />Employees</NavLink>
          <NavLink to="/manager/rota-builder" className={navLinkClass}><CalendarPlus className={iconSize} />Rota Builder</NavLink>
          <NavLink to="/manager/shifts-to-cover" className={navLinkClass}><AlertCircle className={iconSize} />Shifts to Cover</NavLink>
          <NavLink to="/manager/reports" className={navLinkClass}><BarChart3 className={iconSize} />Reports</NavLink>
        </RoleGate>

        <RoleGate allowedRoles={["SYSTEM_ADMIN"]}>
          <div className={isCompact ? "pt-3 pb-1" : "pt-4 pb-2"}>
            <p className={sectionLabel}>Admin</p>
          </div>
          <NavLink to="/admin" className={navLinkClass}><Shield className={iconSize} />System Admin</NavLink>
        </RoleGate>
      </nav>

      <div className={clsx(
        "border-t px-3 py-3 space-y-1",
        isCompact ? "border-gray-800 px-2 py-2 space-y-0.5" : "",
      )}>
        <NavLink to="/settings" className={navLinkClass}><Settings className={iconSize} />Settings</NavLink>
        <button onClick={() => logoutMutation.mutate()} className={logoutBtnClass}>
          <LogOut className={iconSize} />Logout
        </button>
      </div>

      {user && (
        <div className={clsx(
          "border-t px-4 py-3",
          isCompact ? "border-gray-800 px-3 py-2" : "",
        )}>
          <p className={clsx(
            "font-medium",
            isCompact ? "text-xs text-gray-300" : isModern ? "text-sm text-gray-900" : "text-sm text-gray-900",
          )}>
            {user.firstName} {user.lastName}
          </p>
          <p className={clsx(
            isCompact ? "text-[11px] text-gray-500" : "text-xs text-gray-500",
          )}>{user.email}</p>
        </div>
      )}
    </aside>
  );
}
