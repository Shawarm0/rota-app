import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useAvailableShifts, useClaimShift } from "../hooks/useShifts";
import { formatDate, formatDay } from "../lib/dateUtils";
import { ShoppingBag, MapPin, Clock } from "lucide-react";

export function ShiftPotPage() {
  const { data: shifts, isLoading } = useAvailableShifts();
  const claimMutation = useClaimShift();

  return (
    <>
      <TopBar title="Shift Pot" />
      <div className="p-4 md:p-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !shifts?.length ? (
          <EmptyState icon={ShoppingBag} title="No available shifts" description="There are no shifts to pick up right now" />
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDay(shift.date)} {formatDate(shift.date)}
                    </p>
                    <Badge variant="gray">Available</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {shift.startTime} - {shift.endTime}
                    </span>
                    {shift.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {shift.location}
                      </span>
                    )}
                  </div>
                  {shift.notes && <p className="text-xs text-gray-400 mt-1">{shift.notes}</p>}
                </div>
                <Button
                  size="sm"
                  onClick={() => claimMutation.mutate(shift.id)}
                  loading={claimMutation.isPending}
                >
                  Claim
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
