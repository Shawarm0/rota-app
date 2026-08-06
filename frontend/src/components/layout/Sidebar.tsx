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
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  );

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">Rota</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink to="/calendar" className={navLinkClass}>
          <Calendar className="h-5 w-5" />
          Calendar
        </NavLink>
        <NavLink to="/my-shifts" className={navLinkClass}>
          <Clock className="h-5 w-5" />
          My Shifts
        </NavLink>
        <NavLink to="/shift-pot" className={navLinkClass}>
          <ShoppingBag className="h-5 w-5" />
          Shift Pot
        </NavLink>
        <NavLink to="/holidays" className={navLinkClass}>
          <Palmtree className="h-5 w-5" />
          Holidays
        </NavLink>
        <NavLink to="/notifications" className={navLinkClass}>
          <Bell className="h-5 w-5" />
          Notifications
        </NavLink>

        <RoleGate allowedRoles={["MANAGER"]}>
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manager</p>
          </div>
          <NavLink to="/manager" className={navLinkClass}>
            <LayoutDashboard className="h-5 w-5" />
            Manager Dashboard
          </NavLink>
          <NavLink to="/manager/employees" className={navLinkClass}>
            <Users className="h-5 w-5" />
            Employees
          </NavLink>
          <NavLink to="/manager/rota-builder" className={navLinkClass}>
            <CalendarPlus className="h-5 w-5" />
            Rota Builder
          </NavLink>
          <NavLink to="/manager/shifts-to-cover" className={navLinkClass}>
            <AlertCircle className="h-5 w-5" />
            Shifts to Cover
          </NavLink>
          <NavLink to="/manager/reports" className={navLinkClass}>
            <BarChart3 className="h-5 w-5" />
            Reports
          </NavLink>
        </RoleGate>

        <RoleGate allowedRoles={["SYSTEM_ADMIN"]}>
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
          </div>
          <NavLink to="/admin" className={navLinkClass}>
            <Shield className="h-5 w-5" />
            System Admin
          </NavLink>
        </RoleGate>
      </nav>

      <div className="border-t px-3 py-3 space-y-1">
        <NavLink to="/settings" className={navLinkClass}>
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>

      {user && (
        <div className="border-t px-4 py-3">
          <p className="text-sm font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      )}
    </aside>
  );
}
