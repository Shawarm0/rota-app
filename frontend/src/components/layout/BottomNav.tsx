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

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <NavLink
              to="/my-shifts"
              onClick={() => setMoreOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
            >
              My Shifts
            </NavLink>
            <NavLink
              to="/holidays"
              onClick={() => setMoreOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Holidays
            </NavLink>
            <NavLink
              to="/settings"
              onClick={() => setMoreOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Settings
            </NavLink>
            {role === "MANAGER" && (
              <>
                <NavLink
                  to="/manager"
                  onClick={() => setMoreOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Manager Dashboard
                </NavLink>
                <NavLink
                  to="/manager/employees"
                  onClick={() => setMoreOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Employees
                </NavLink>
                <NavLink
                  to="/manager/rota-builder"
                  onClick={() => setMoreOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Rota Builder
                </NavLink>
                <NavLink
                  to="/manager/shifts-to-cover"
                  onClick={() => setMoreOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Shifts to Cover
                </NavLink>
                <NavLink
                  to="/manager/reports"
                  onClick={() => setMoreOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Reports
                </NavLink>
              </>
            )}
            {role === "SYSTEM_ADMIN" && (
              <NavLink
                to="/admin"
                onClick={() => setMoreOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                System Admin
              </NavLink>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-gray-500"
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
