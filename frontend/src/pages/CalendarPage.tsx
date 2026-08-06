import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { ShiftBadge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useQuery } from "@tanstack/react-query";
import { useApprovedHolidays } from "../hooks/useHolidays";
import { useUpdateShift } from "../hooks/useRotas";
import { useAuthStore } from "../stores/authStore";
import * as shiftApi from "../api/shift.api";
import * as userApi from "../api/user.api";
import { getDaysInMonth, isSameDay, toDateString, formatDate } from "../lib/dateUtils";
import type { Shift, ShiftStatus } from "../types";
import clsx from "clsx";

const STATUS_DOT_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-shift-assigned",
  ADDITIONAL: "bg-shift-additional",
  HOLIDAY: "bg-shift-holiday",
  REQUESTED_HOLIDAY: "bg-shift-requested",
  AVAILABLE: "bg-shift-available",
  CANCELLED: "bg-shift-cancelled",
};

interface ShiftEditForm {
  startTime: string;
  endTime: string;
  userId: string;
  location: string;
  notes: string;
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShifts, setSelectedShifts] = useState<Shift[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const role = useAuthStore((s) => s.user?.role);
  const isManager = role === "MANAGER" || role === "SYSTEM_ADMIN";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const from = toDateString(new Date(year, month, 1));
  const to = toDateString(new Date(year, month + 1, 0));

  const { data: myShifts, isLoading: myLoading } = useQuery({
    queryKey: ["myShifts", from, to],
    queryFn: () => shiftApi.getMyShifts(from, to),
    enabled: !isManager,
  });
  const { data: allShifts, isLoading: allLoading } = useQuery({
    queryKey: ["allShifts", from, to],
    queryFn: () => shiftApi.getAllShifts(from, to),
    enabled: isManager,
  });
  const { data: holidays } = useApprovedHolidays(from, to);
  const { data: employees } = useQuery({
    queryKey: ["users", "EMPLOYEE"],
    queryFn: () => userApi.listUsers("EMPLOYEE"),
    enabled: isManager,
  });
  const updateShift = useUpdateShift();
  const shiftForm = useForm<ShiftEditForm>();

  const shifts = isManager ? allShifts : myShifts;
  const isLoading = isManager ? allLoading : myLoading;

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startPadding = (firstDay.getDay() + 6) % 7;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getShiftsForDay = (day: Date) => shifts?.filter((s) => isSameDay(s.date, day)) || [];
  const isHolidayDay = (day: Date) => holidays?.some((h) => isSameDay(h.date, day)) || false;

  const today = new Date();

  const handleDayClick = (day: Date, dayShifts: Shift[]) => {
    if (dayShifts.length > 0 || isHolidayDay(day)) {
      setSelectedShifts(dayShifts);
      setSelectedDay(day);
    }
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    shiftForm.reset({
      startTime: shift.startTime,
      endTime: shift.endTime,
      userId: shift.userId || "",
      location: shift.location || "",
      notes: shift.notes || "",
    });
    setSelectedShifts(null);
  };

  const onSaveShift = (data: ShiftEditForm) => {
    if (!editingShift) return;
    updateShift.mutate(
      { id: editingShift.id, data: { ...data, userId: data.userId || null } },
      { onSuccess: () => setEditingShift(null) },
    );
  };

  const employeeOptions = [
    { value: "", label: "Unassigned" },
    ...(employees?.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })) || []),
  ];

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
                  const hasHoliday = isHolidayDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={clsx(
                        "p-1 min-h-[60px] border border-gray-50 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
                        isToday && "bg-blue-50",
                        hasHoliday && !isToday && "bg-red-50",
                      )}
                      onClick={() => handleDayClick(day, dayShifts)}
                    >
                      <span
                        className={clsx(
                          "text-xs font-medium",
                          isToday ? "text-blue-600" : hasHoliday ? "text-red-600" : "text-gray-700",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {hasHoliday && (
                        <div className="text-[9px] text-red-500 font-medium leading-tight">Holiday</div>
                      )}
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {dayShifts.slice(0, 4).map((s) => (
                          <div
                            key={s.id}
                            className={clsx("h-2 w-2 rounded-full", STATUS_DOT_COLORS[s.status])}
                            title={`${s.user ? `${s.user.firstName} ` : ""}${s.startTime}-${s.endTime}`}
                          />
                        ))}
                        {dayShifts.length > 4 && (
                          <span className="text-[8px] text-gray-400">+{dayShifts.length - 4}</span>
                        )}
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
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="text-xs text-gray-500">Approved holiday</span>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={!!selectedShifts}
        onClose={() => { setSelectedShifts(null); setSelectedDay(null); }}
        title={selectedDay ? `Shifts — ${formatDate(selectedDay)}` : "Shift Details"}
      >
        {selectedDay && isHolidayDay(selectedDay) && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-sm font-medium text-red-700">Approved Holiday</p>
          </div>
        )}
        {selectedShifts && selectedShifts.length > 0 ? (
          <div className="space-y-3">
            {selectedShifts.map((shift) => (
              <div
                key={shift.id}
                className={clsx(
                  "flex items-center justify-between rounded-lg border p-3",
                  isManager && "cursor-pointer hover:bg-gray-50",
                )}
                onClick={() => isManager && handleEditShift(shift)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShiftBadge status={shift.status} />
                    {shift.user && (
                      <span className="text-xs text-gray-500">{shift.user.firstName} {shift.user.lastName}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {shift.startTime} - {shift.endTime}
                    {shift.location && ` · ${shift.location}`}
                  </p>
                  {shift.notes && <p className="text-xs text-gray-400">{shift.notes}</p>}
                </div>
                {isManager && (
                  <span className="text-xs text-gray-400">Edit &rarr;</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No shifts on this day.</p>
        )}
      </Modal>

      {isManager && (
        <Modal open={!!editingShift} onClose={() => setEditingShift(null)} title="Edit Shift">
          <form onSubmit={shiftForm.handleSubmit(onSaveShift)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input id="startTime" label="Start Time" type="time" {...shiftForm.register("startTime", { required: true })} />
              <Input id="endTime" label="End Time" type="time" {...shiftForm.register("endTime", { required: true })} />
            </div>
            <Select id="userId" label="Employee" options={employeeOptions} {...shiftForm.register("userId")} />
            <Input id="location" label="Location" {...shiftForm.register("location")} />
            <Input id="notes" label="Notes" {...shiftForm.register("notes")} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setEditingShift(null)}>Cancel</Button>
              <Button type="submit" loading={updateShift.isPending}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
