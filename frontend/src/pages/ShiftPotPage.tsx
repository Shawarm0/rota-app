import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useAvailableShifts, useClaimShift } from "../hooks/useShifts";
import { formatDate, formatDay } from "../lib/dateUtils";
import { ShoppingBag, MapPin, Clock } from "lucide-react";

export function ShiftPotPage() {
  const { data: shifts, isLoading } = useAvailableShifts();
  const claimMutation = useClaimShift();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const count = shifts?.length || 0;

  return (
    <>
      <TopBar title="Shift Pot" subtitle={`${count} available shift${count !== 1 ? "s" : ""}`} />
      <div className="p-4 md:px-7 md:py-5 flex flex-col gap-3 max-w-[1200px]">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !shifts?.length ? (
          <EmptyState icon={ShoppingBag} title="No available shifts" description="There are no shifts to pick up right now" />
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
                  <span className="text-[11.5px] font-semibold px-[9px] py-[3px] rounded-full bg-gray-100 text-gray-500">Available</span>
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
              <button
                onClick={() => {
                  setClaimingId(shift.id);
                  claimMutation.mutate(shift.id, {
                    onSettled: () => setClaimingId(null),
                  });
                }}
                disabled={claimMutation.isPending}
                className="flex items-center gap-[7px] bg-indigo-600 text-white rounded-lg px-4 py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
              >
                {claimingId === shift.id ? "Claiming..." : "Claim Shift"}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
