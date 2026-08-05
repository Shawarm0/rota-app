import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { ShiftBadge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { useMyShifts } from "../hooks/useShifts";
import { getDaysInMonth, isSameDay, toDateString, formatDate } from "../lib/dateUtils";
import type { Shift, ShiftStatus } from "../types";
import clsx from "clsx";

const STATUS_DOT_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-shift-assigned",
  ADDITIONAL: "bg-shift-additional",
  SWAP: "bg-shift-swap",
  HOLIDAY: "bg-shift-holiday",
  REQUESTED_HOLIDAY: "bg-shift-requested",
  AVAILABLE: "bg-shift-available",
  CANCELLED: "bg-shift-cancelled",
};

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const from = toDateString(new Date(year, month, 1));
  const to = toDateString(new Date(year, month + 1, 0));

  const { data: shifts, isLoading } = useMyShifts(from, to);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startPadding = (firstDay.getDay() + 6) % 7;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getShiftsForDay = (day: Date) => shifts?.filter((s) => isSameDay(s.date, day)) || [];

  const today = new Date();

  return (
    <>
      <TopBar title="Calendar" />
      <div className="p-4 md:p-6">
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold">
              {currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <div className="p-2">
              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="p-1 min-h-[60px]" />
                ))}
                {days.map((day) => {
                  const dayShifts = getShiftsForDay(day);
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={day.toISOString()}
                      className={clsx(
                        "p-1 min-h-[60px] border border-gray-50 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
                        isToday && "bg-blue-50",
                      )}
                      onClick={() => {
                        if (dayShifts.length > 0) setSelectedShift(dayShifts[0]);
                      }}
                    >
                      <span
                        className={clsx(
                          "text-xs font-medium",
                          isToday ? "text-blue-600" : "text-gray-700",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {dayShifts.map((s) => (
                          <div
                            key={s.id}
                            className={clsx("h-2 w-2 rounded-full", STATUS_DOT_COLORS[s.status])}
                            title={`${s.startTime}-${s.endTime}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t px-5 py-3 flex flex-wrap gap-3">
            {Object.entries(STATUS_DOT_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={clsx("h-2.5 w-2.5 rounded-full", color)} />
                <span className="text-xs text-gray-500 capitalize">{status.toLowerCase().replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={!!selectedShift} onClose={() => setSelectedShift(null)} title="Shift Details">
        {selectedShift && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShiftBadge status={selectedShift.status} />
            </div>
            <div className="text-sm space-y-2">
              <p><span className="text-gray-500">Date:</span> {formatDate(selectedShift.date)}</p>
              <p><span className="text-gray-500">Time:</span> {selectedShift.startTime} - {selectedShift.endTime}</p>
              {selectedShift.location && <p><span className="text-gray-500">Location:</span> {selectedShift.location}</p>}
              {selectedShift.notes && <p><span className="text-gray-500">Notes:</span> {selectedShift.notes}</p>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
