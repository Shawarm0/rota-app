import { useAuthStore } from "../stores/authStore";
import { TopBar } from "../components/layout/TopBar";
import { ShiftBadge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { useMyShifts } from "../hooks/useShifts";
import { Calendar, Clock, ShoppingBag, Palmtree } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate, formatDay, toDateString } from "../lib/dateUtils";

function getTodayFormatted() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: shifts, isLoading } = useMyShifts();

  const upcomingShifts = shifts
    ?.filter((s) => new Date(s.date) >= new Date(toDateString(new Date())))
    .slice(0, 5) || [];

  const nextShift = upcomingShifts[0];

  const quickActions = [
    { label: "Calendar", icon: Calendar, to: "/calendar", bg: "bg-indigo-50", color: "text-indigo-600" },
    { label: "My Shifts", icon: Clock, to: "/my-shifts", bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Shift Pot", icon: ShoppingBag, to: "/shift-pot", bg: "bg-purple-50", color: "text-purple-600" },
    { label: "Holidays", icon: Palmtree, to: "/holidays", bg: "bg-amber-50", color: "text-amber-600" },
  ];

  return (
    <>
      <TopBar title="Dashboard" subtitle={getTodayFormatted()} />
      <div className="p-4 md:px-7 md:py-5 flex flex-col gap-5 max-w-[1200px]">
        {/* Greeting card */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
          <div className="text-[18px] font-bold text-gray-900">Hello, {user?.firstName}!</div>
          <div className="text-[13.5px] text-gray-500 mt-0.5">Here's your overview</div>
        </div>

        {/* Quick links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map(({ label, icon: Icon, to, bg, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="bg-white border border-gray-200 rounded-xl py-[22px] px-4 flex flex-col items-center gap-[10px] cursor-pointer hover:border-gray-300 transition-colors"
            >
              <div className={`w-10 h-10 rounded-[10px] ${bg} ${color} flex items-center justify-center`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[13.5px] font-semibold text-gray-900">{label}</span>
            </button>
          ))}
        </div>

        {/* Next Shift */}
        {nextShift && (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-[18px]">
            <div className="text-sm font-bold text-gray-900 mb-[14px]">Next Shift</div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-[14px] min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-[19px] w-[19px]" />
                </div>
                <div>
                  <div className="text-[14.5px] font-semibold text-gray-900">
                    {formatDay(nextShift.date)} {formatDate(nextShift.date)}
                  </div>
                  <div className="text-[12.5px] text-gray-500">
                    {nextShift.startTime} - {nextShift.endTime}
                    {nextShift.location && ` · ${nextShift.location}`}
                  </div>
                </div>
              </div>
              <ShiftBadge status={nextShift.status} />
            </div>
          </div>
        )}

        {/* Upcoming Shifts */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-[18px] border-b border-gray-200">
            <div className="text-sm font-bold text-gray-900">Upcoming Shifts</div>
          </div>
          {isLoading ? (
            <div className="px-5 py-6 flex justify-center"><Spinner size="sm" /></div>
          ) : upcomingShifts.length === 0 ? (
            <div className="px-5 py-6 text-sm text-gray-500">No upcoming shifts</div>
          ) : (
            <div>
              {upcomingShifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-[14px] border-t first:border-t-0 border-gray-100 flex-wrap">
                  <div>
                    <div className="text-[13.5px] font-semibold text-gray-900">
                      {formatDay(s.date)} {formatDate(s.date)}
                    </div>
                    <div className="text-[12.5px] text-gray-500 mt-[1px]">
                      {s.startTime} - {s.endTime}
                    </div>
                  </div>
                  <ShiftBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
