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
import { useLogout } from "../../hooks/useAuth";
import { RoleGate } from "../auth/RoleGate";
import clsx from "clsx";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
    isActive ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  );

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <div className="h-7 w-7 rounded-md bg-violet-600 flex items-center justify-center">
          <Clock className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900">Rota</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NavLink to="/dashboard" className={navLinkClass}><LayoutDashboard className="h-4 w-4" />Dashboard</NavLink>
        <NavLink to="/calendar" className={navLinkClass}><Calendar className="h-4 w-4" />Calendar</NavLink>
        <NavLink to="/my-shifts" className={navLinkClass}><Clock className="h-4 w-4" />My Shifts</NavLink>
        <NavLink to="/shift-pot" className={navLinkClass}><ShoppingBag className="h-4 w-4" />Shift Pot</NavLink>
        <NavLink to="/holidays" className={navLinkClass}><Palmtree className="h-4 w-4" />Holidays</NavLink>
        <NavLink to="/notifications" className={navLinkClass}><Bell className="h-4 w-4" />Notifications</NavLink>

        <RoleGate allowedRoles={["MANAGER"]}>
          <div className="pt-3 pb-1">
            <p className="px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Manager</p>
          </div>
          <NavLink to="/manager" className={navLinkClass}><LayoutDashboard className="h-4 w-4" />Manager Dashboard</NavLink>
          <NavLink to="/manager/employees" className={navLinkClass}><Users className="h-4 w-4" />Employees</NavLink>
          <NavLink to="/manager/rota-builder" className={navLinkClass}><CalendarPlus className="h-4 w-4" />Rota Builder</NavLink>
          <NavLink to="/manager/shifts-to-cover" className={navLinkClass}><AlertCircle className="h-4 w-4" />Shifts to Cover</NavLink>
          <NavLink to="/manager/reports" className={navLinkClass}><BarChart3 className="h-4 w-4" />Reports</NavLink>
        </RoleGate>

        <RoleGate allowedRoles={["SYSTEM_ADMIN"]}>
          <div className="pt-3 pb-1">
            <p className="px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
          </div>
          <NavLink to="/admin" className={navLinkClass}><Shield className="h-4 w-4" />System Admin</NavLink>
        </RoleGate>
      </nav>

      <div className="border-t border-gray-200 px-2 py-2 space-y-0.5">
        <NavLink to="/settings" className={navLinkClass}><Settings className="h-4 w-4" />Settings</NavLink>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />Logout
        </button>
      </div>

      {user && (
        <div className="border-t border-gray-200 px-3 py-2">
          <p className="text-xs font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-[11px] text-gray-500">{user.email}</p>
        </div>
      )}
    </aside>
  );
}
