import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { ShiftBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useMyShifts } from "../hooks/useShifts";
import { useRequestSwap } from "../hooks/useSwaps";
import { formatDate, formatDay } from "../lib/dateUtils";
import { Clock, ArrowRightLeft } from "lucide-react";

export function MyShiftsPage() {
  const { data: shifts, isLoading } = useMyShifts();
  const swapMutation = useRequestSwap();

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
              {shift.status === "ASSIGNED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => swapMutation.mutate(shift.id)}
                  loading={swapMutation.isPending}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  Swap
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
}
