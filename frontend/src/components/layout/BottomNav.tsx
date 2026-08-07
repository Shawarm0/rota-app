import { NavLink } from "react-router-dom";
import { LayoutDashboard, Calendar, ShoppingBag, Bell, Menu } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
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

  const sheetItemClass = "block rounded-md px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-100";

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-14 left-0 right-0 bg-white border-t border-gray-200 rounded-t-lg shadow-xl p-3 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
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

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white safe-area-pb">
        <div className="flex items-center justify-around py-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-indigo-600" : "text-gray-500",
                )
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium text-gray-500"
          >
            <Menu className="h-4.5 w-4.5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
