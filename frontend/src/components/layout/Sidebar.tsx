import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import { useIsDesktop } from "../../hooks/useMediaQuery";
import { RoleGate } from "../auth/RoleGate";
import clsx from "clsx";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[14px] transition-colors",
    isActive ? "bg-indigo-50 text-gray-900 font-semibold" : "text-gray-500 font-medium hover:bg-gray-100 hover:text-gray-900",
  );

const navIconClass = (isActive: boolean) =>
  clsx("h-[18px] w-[18px] flex-shrink-0", isActive ? "text-indigo-600" : "text-gray-400");

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const isDesktop = useIsDesktop();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const location = useLocation();

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [location.pathname, isDesktop, setSidebarOpen]);

  const sidebarContent = (
    <aside
      className={clsx(
        "flex flex-col bg-white border-r border-gray-200",
        isDesktop
          ? "w-56 h-screen sticky top-0 flex-shrink-0"
          : "fixed top-0 left-0 h-full w-[260px] z-50 transition-transform duration-200 ease-out",
        !isDesktop && (sidebarOpen ? "translate-x-0" : "-translate-x-full"),
      )}
    >
      <div className="flex items-center gap-[10px] px-6 h-16 border-b border-gray-200 flex-shrink-0">
        <div className="h-[30px] w-[30px] rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <div className="h-3 w-3 bg-white rounded-[3px]" />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-[-0.01em]">Rota</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <NavLink to="/dashboard" className={navLinkClass}>
          {({ isActive }) => <><LayoutDashboard className={navIconClass(isActive)} />Dashboard</>}
        </NavLink>
        <NavLink to="/calendar" className={navLinkClass}>
          {({ isActive }) => <><Calendar className={navIconClass(isActive)} />Calendar</>}
        </NavLink>
        <NavLink to="/my-shifts" className={navLinkClass}>
          {({ isActive }) => <><Clock className={navIconClass(isActive)} />My Shifts</>}
        </NavLink>
        <NavLink to="/shift-pot" className={navLinkClass}>
          {({ isActive }) => <><ShoppingBag className={navIconClass(isActive)} />Shift Pot</>}
        </NavLink>
        <NavLink to="/holidays" className={navLinkClass}>
          {({ isActive }) => <><Palmtree className={navIconClass(isActive)} />Holidays</>}
        </NavLink>
        <NavLink to="/notifications" className={navLinkClass}>
          {({ isActive }) => <><Bell className={navIconClass(isActive)} />Notifications</>}
        </NavLink>

        <RoleGate allowedRoles={["MANAGER"]}>
          <div className="pt-4 pb-1">
            <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.04em]">Manager</p>
          </div>
          <NavLink to="/manager" end className={navLinkClass}>
            {({ isActive }) => <><LayoutDashboard className={navIconClass(isActive)} />Dashboard</>}
          </NavLink>
          <NavLink to="/manager/employees" className={navLinkClass}>
            {({ isActive }) => <><Users className={navIconClass(isActive)} />Employees</>}
          </NavLink>
          <NavLink to="/manager/rota-builder" className={navLinkClass}>
            {({ isActive }) => <><CalendarPlus className={navIconClass(isActive)} />Rota Builder</>}
          </NavLink>
          <NavLink to="/manager/shifts-to-cover" className={navLinkClass}>
            {({ isActive }) => <><AlertCircle className={navIconClass(isActive)} />Shifts to Cover</>}
          </NavLink>
          <NavLink to="/manager/reports" className={navLinkClass}>
            {({ isActive }) => <><BarChart3 className={navIconClass(isActive)} />Reports</>}
          </NavLink>
        </RoleGate>

        <RoleGate allowedRoles={["SYSTEM_ADMIN"]}>
          <div className="pt-4 pb-1">
            <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.04em]">Admin</p>
          </div>
          <NavLink to="/admin" className={navLinkClass}>
            {({ isActive }) => <><Shield className={navIconClass(isActive)} />System Admin</>}
          </NavLink>
        </RoleGate>
      </nav>

      <div className="border-t border-gray-200 px-3 py-2 space-y-0.5">
        <NavLink to="/settings" className={navLinkClass}>
          {({ isActive }) => <><Settings className={navIconClass(isActive)} />Settings</>}
        </NavLink>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-[9px] text-[14px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] text-gray-400" />Logout
        </button>
      </div>

      {user && (
        <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-[10px]">
          <div className="h-[34px] w-[34px] rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[13px] font-bold flex-shrink-0">
            {(user.firstName[0] || "")}{(user.lastName[0] || "")}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[12px] text-gray-500">{user.role === "MANAGER" ? "Manager" : user.role === "SYSTEM_ADMIN" ? "Admin" : "Employee"}</p>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {sidebarContent}
    </>
  );
}
