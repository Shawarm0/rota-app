import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { ShiftBadge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useMyShifts } from "../hooks/useShifts";
import { formatDate, formatDay } from "../lib/dateUtils";
import { Clock } from "lucide-react";

export function MyShiftsPage() {
  const { data: shifts, isLoading } = useMyShifts();

  return (
    <>
      <TopBar title="My Shifts" />
      <div className="p-4 md:p-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !shifts?.length ? (
          <EmptyState icon={Clock} title="No shifts" description="You don't have any published shifts yet" />
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDay(shift.date)} {formatDate(shift.date)}
                  </p>
                  <ShiftBadge status={shift.status} />
                </div>
                <p className="text-sm text-gray-600">
                  {shift.startTime} - {shift.endTime}
                  {shift.location && ` · ${shift.location}`}
                </p>
                {shift.notes && <p className="text-xs text-gray-400 mt-0.5">{shift.notes}</p>}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
