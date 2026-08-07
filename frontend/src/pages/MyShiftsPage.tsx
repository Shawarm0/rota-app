import { TopBar } from "../components/layout/TopBar";
import { ShiftBadge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useMyShifts } from "../hooks/useShifts";
import { formatDate, formatDay } from "../lib/dateUtils";
import { Clock, MapPin } from "lucide-react";

export function MyShiftsPage() {
  const { data: shifts, isLoading } = useMyShifts();
  const count = shifts?.length || 0;

  return (
    <>
      <TopBar title="My Shifts" subtitle={`${count} shift${count !== 1 ? "s" : ""}`} />
      <div className="p-4 md:px-7 md:py-5 flex flex-col gap-3 max-w-[1200px]">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !shifts?.length ? (
          <EmptyState icon={Clock} title="No shifts" description="You don't have any published shifts yet" />
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-[18px] flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-[10px] flex-wrap">
                  <div className="text-[14.5px] font-semibold text-gray-900">
                    {formatDay(shift.date)} {formatDate(shift.date)}
                  </div>
                  <ShiftBadge status={shift.status} />
                </div>
                <div className="flex items-center gap-[14px] mt-[6px] flex-wrap">
                  <span className="flex items-center gap-[5px] text-[13px] text-gray-500">
                    <Clock className="h-[14px] w-[14px]" />
                    {shift.startTime} - {shift.endTime}
                  </span>
                  {shift.location && (
                    <span className="flex items-center gap-[5px] text-[13px] text-gray-500">
                      <MapPin className="h-[14px] w-[14px]" />
                      {shift.location}
                    </span>
                  )}
                </div>
                {shift.notes && (
                  <p className="text-[12px] text-gray-400 mt-1">{shift.notes}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
