import { NavLink } from "react-router-dom";
import { LayoutDashboard, Calendar, ShoppingBag, Bell, Menu } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useUiStore } from "../../stores/uiStore";
import clsx from "clsx";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/shift-pot", icon: ShoppingBag, label: "Shifts" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const theme = useUiStore((s) => s.theme);

  const isCompact = theme === "compact";
  const isModern = theme === "modern";

  const sheetClass = clsx(
    "absolute bottom-16 left-0 right-0 shadow-xl p-4 space-y-2",
    isCompact ? "bg-gray-950 rounded-t-lg border-t border-gray-800" :
    isModern ? "bg-white/90 backdrop-blur-xl rounded-t-3xl" :
    "bg-white rounded-t-2xl",
  );

  const sheetItemClass = clsx(
    "block rounded-lg px-4 py-3 text-sm font-medium",
    isCompact ? "text-gray-300 hover:bg-gray-800 rounded-md" :
    isModern ? "text-gray-700 hover:bg-gray-100 rounded-xl" :
    "hover:bg-gray-50",
  );

  const navBarClass = clsx(
    "fixed z-30 safe-area-pb",
    isModern ? "bottom-4 left-4 right-4 rounded-2xl bg-white/80 backdrop-blur-lg shadow-lg border border-white/20" :
    isCompact ? "bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-950" :
    "bottom-0 left-0 right-0 border-t bg-white",
  );

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMoreOpen(false)}>
          <div className={sheetClass} onClick={(e) => e.stopPropagation()}>
            <NavLink to="/my-shifts" onClick={() => setMoreOpen(false)} className={sheetItemClass}>My Shifts</NavLink>
            <NavLink to="/holidays" onClick={() => setMoreOpen(false)} className={sheetItemClass}>Holidays</NavLink>
            <NavLink to="/settings" onClick={() => setMoreOpen(false)} className={sheetItemClass}>Settings</NavLink>
            {role === "MANAGER" && (
              <>
                <NavLink to="/manager" onClick={() => setMoreOpen(false)} className={sheetItemClass}>Manager Dashboard</NavLink>
                <NavLink to="/manager/employees" onClick={() => setMoreOpen(false)} className={sheetItemClass}>Employees</NavLink>
                <NavLink to="/manager/rota-builder" onClick={() => setMoreOpen(false)} className={sheetItemClass}>Rota Builder</NavLink>
                <NavLink to="/manager/shifts-to-cover" onClick={() => setMoreOpen(false)} className={sheetItemClass}>Shifts to Cover</NavLink>
                <NavLink to="/manager/reports" onClick={() => setMoreOpen(false)} className={sheetItemClass}>Reports</NavLink>
              </>
            )}
            {role === "SYSTEM_ADMIN" && (
              <NavLink to="/admin" onClick={() => setMoreOpen(false)} className={sheetItemClass}>System Admin</NavLink>
            )}
          </div>
        </div>
      )}

      <nav className={navBarClass}>
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? (isCompact ? "text-violet-400" : isModern ? "text-indigo-600" : "text-blue-600")
                    : (isCompact ? "text-gray-500" : "text-gray-500"),
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium",
              isCompact ? "text-gray-500" : "text-gray-500",
            )}
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
