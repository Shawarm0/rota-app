import { useAuthStore } from "../stores/authStore";
import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { ShiftBadge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { useMyShifts } from "../hooks/useShifts";
import { useUnreadCount } from "../hooks/useNotifications";
import { Calendar, Clock, ShoppingBag, Palmtree, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate, formatDay, toDateString } from "../lib/dateUtils";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: shifts, isLoading } = useMyShifts();
  const { data: unreadCount } = useUnreadCount();

  const upcomingShifts = shifts
    ?.filter((s) => new Date(s.date) >= new Date(toDateString(new Date())))
    .slice(0, 5) || [];

  const nextShift = upcomingShifts[0];

  const quickActions = [
    { label: "Calendar", icon: Calendar, to: "/calendar", color: "bg-blue-50 text-blue-600" },
    { label: "My Shifts", icon: Clock, to: "/my-shifts", color: "bg-green-50 text-green-600" },
    { label: "Shift Pot", icon: ShoppingBag, to: "/shift-pot", color: "bg-purple-50 text-purple-600" },
    { label: "Holidays", icon: Palmtree, to: "/holidays", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Hello, {user?.firstName}!
              </h2>
              <p className="text-sm text-gray-500 mt-1">Here's your overview</p>
            </div>
            {unreadCount ? (
              <button
                onClick={() => navigate("/notifications")}
                className="relative p-2 rounded-lg hover:bg-gray-100"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </button>
            ) : null}
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
            >
              <div className={`rounded-xl p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>

        {nextShift && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Next Shift</h3>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatDay(nextShift.date)} {formatDate(nextShift.date)}
                </p>
                <p className="text-sm text-gray-600">
                  {nextShift.startTime} - {nextShift.endTime}
                  {nextShift.location && ` · ${nextShift.location}`}
                </p>
              </div>
              <div className="ml-auto">
                <ShiftBadge status={nextShift.status} />
              </div>
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Shifts</h3>
          {isLoading ? (
            <Spinner size="sm" />
          ) : upcomingShifts.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming shifts</p>
          ) : (
            <div className="space-y-2">
              {upcomingShifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatDay(s.date)} {formatDate(s.date)}</p>
                    <p className="text-xs text-gray-500">{s.startTime} - {s.endTime}</p>
                  </div>
                  <ShiftBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
