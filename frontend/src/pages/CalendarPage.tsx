import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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
import { useUpdateShift, useDeleteShift } from "../hooks/useRotas";
import { useLocations } from "../hooks/useLocations";
import { useAuthStore } from "../stores/authStore";
import * as shiftApi from "../api/shift.api";
import * as userApi from "../api/user.api";
import { getDaysInMonth, isSameDay, toDateString, formatDate } from "../lib/dateUtils";
import type { Shift, ShiftStatus } from "../types";
import clsx from "clsx";

const STATUS_DOT_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-shift-assigned",
  ADDITIONAL: "bg-shift-additional",
  AVAILABLE: "bg-shift-available",
};

const ALL_STATUSES: { value: ShiftStatus; label: string }[] = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ADDITIONAL", label: "Additional" },
  { value: "AVAILABLE", label: "Available" },
];

interface ShiftEditForm {
  startTime: string;
  endTime: string;
  userId: string;
  location: string;
  notes: string;
  status: ShiftStatus;
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShifts, setSelectedShifts] = useState<Shift[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>("");

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
    queryKey: ["allShifts", from, to, locationFilter],
    queryFn: () => shiftApi.getAllShifts(from, to, locationFilter || undefined),
    enabled: isManager,
  });
  const { data: holidays } = useApprovedHolidays(from, to);
  const { data: employees } = useQuery({
    queryKey: ["users", "EMPLOYEE"],
    queryFn: () => userApi.listUsers("EMPLOYEE"),
    enabled: isManager,
  });
  const { data: locations } = useLocations();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const shiftForm = useForm<ShiftEditForm>();

  const shifts = isManager ? allShifts : myShifts;
  const isLoading = isManager ? allLoading : myLoading;

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startPadding = (firstDay.getDay() + 6) % 7;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getShiftsForDay = (day: Date) => shifts?.filter((s) => isSameDay(s.date, day)) || [];
  const getHolidaysForDay = (day: Date) => holidays?.filter((h) => isSameDay(h.date, day)) || [];
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
      status: shift.status,
    });
    setShowAdvanced(false);
    setSelectedShifts(null);
  };

  const onSaveShift = (data: ShiftEditForm) => {
    if (!editingShift) return;
    updateShift.mutate(
      { id: editingShift.id, data: { ...data, userId: data.userId || null, status: data.status } },
      { onSuccess: () => setEditingShift(null) },
    );
  };

  const employeeOptions = [
    { value: "", label: "Unassigned" },
    ...(employees?.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })) || []),
  ];

  const locationOptions = [
    { value: "", label: "All locations" },
    ...(locations?.map((l) => ({ value: l.name, label: l.name })) || []),
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
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">
                {currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </h2>
              {isManager && locations && locations.length > 0 && (
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1.5 text-gray-600 bg-white"
                >
                  {locationOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            </div>
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
                  const dayHolidays = getHolidaysForDay(day);
                  const isToday = isSameDay(day, today);
                  const hasApprovedHoliday = dayHolidays.some((h) => h.status === "APPROVED");
                  const hasPendingHoliday = dayHolidays.some((h) => h.status === "PENDING");
                  const hasHoliday = dayHolidays.length > 0;
                  return (
                    <div
                      key={day.toISOString()}
                      className={clsx(
                        "p-1 min-h-[60px] border border-gray-50 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
                        isToday && "bg-blue-50",
                        hasApprovedHoliday && !isToday && "bg-red-50",
                        hasPendingHoliday && !hasApprovedHoliday && !isToday && "bg-yellow-50",
                      )}
                      onClick={() => handleDayClick(day, dayShifts)}
                    >
                      <span
                        className={clsx(
                          "text-xs font-medium",
                          isToday ? "text-blue-600" : hasApprovedHoliday ? "text-red-600" : hasPendingHoliday ? "text-yellow-600" : "text-gray-700",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {isManager && dayHolidays.length > 0 && (
                        <div className="space-y-px">
                          {dayHolidays.slice(0, 2).map((h) => (
                            <div
                              key={h.id}
                              className={clsx(
                                "text-[9px] font-medium leading-tight truncate",
                                h.status === "APPROVED" ? "text-red-500" : "text-yellow-600",
                              )}
                            >
                              {h.user ? `${h.user.firstName}` : "Holiday"} {h.status === "PENDING" ? "⏳" : ""}
                            </div>
                          ))}
                          {dayHolidays.length > 2 && (
                            <div className="text-[8px] text-gray-400">+{dayHolidays.length - 2} more</div>
                          )}
                        </div>
                      )}
                      {!isManager && hasHoliday && (
                        <div className="text-[9px] text-red-500 font-medium leading-tight">Holiday</div>
                      )}
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {dayShifts.slice(0, 4).map((s) => (
                          <div
                            key={s.id}
                            className={clsx("h-2 w-2 rounded-full", STATUS_DOT_COLORS[s.status])}
                            title={`${s.user ? `${s.user.firstName} ` : ""}${s.startTime}-${s.endTime}${s.location ? ` · ${s.location}` : ""}`}
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
            {Object.entries(STATUS_DOT_COLORS)
              .map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={clsx("h-2.5 w-2.5 rounded-full", color)} />
                <span className="text-xs text-gray-500 capitalize">{status.toLowerCase().replace("_", " ")}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="text-xs text-gray-500">Approved holiday</span>
            </div>
            {isManager && (
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <span className="text-xs text-gray-500">Requested holiday</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={!!selectedShifts}
        onClose={() => { setSelectedShifts(null); setSelectedDay(null); }}
        title={selectedDay ? `Shifts — ${formatDate(selectedDay)}` : "Shift Details"}
      >
        {selectedDay && getHolidaysForDay(selectedDay).length > 0 && (
          <div className="mb-4 space-y-2">
            {getHolidaysForDay(selectedDay).map((h) => (
              <div
                key={h.id}
                className={clsx(
                  "rounded-lg border px-3 py-2",
                  h.status === "APPROVED" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200",
                )}
              >
                <div className="flex items-center gap-2">
                  <p className={clsx("text-sm font-medium", h.status === "APPROVED" ? "text-red-700" : "text-yellow-700")}>
                    {h.status === "APPROVED" ? "Approved Holiday" : "Requested Holiday"}
                  </p>
                  {h.user && (
                    <span className="text-xs text-gray-500">— {h.user.firstName} {h.user.lastName}</span>
                  )}
                </div>
                {h.reason && <p className="text-xs text-gray-500 mt-0.5">{h.reason}</p>}
              </div>
            ))}
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
            <Select
              id="location"
              label="Location"
              options={[
                { value: "", label: "No location" },
                ...(locations?.map((l) => ({ value: l.name, label: l.name })) || []),
              ]}
              {...shiftForm.register("location")}
            />
            <Input id="notes" label="Notes" {...shiftForm.register("notes")} />
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAdvanced ? "Hide Advanced" : "Advanced"}
              </button>
              {showAdvanced && (
                <div className="mt-2">
                  <Select
                    id="status"
                    label="Status"
                    options={ALL_STATUSES}
                    {...shiftForm.register("status")}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button
                variant="danger"
                type="button"
                size="sm"
                onClick={() => {
                  deleteShift.mutate(editingShift!.id);
                  setEditingShift(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={() => setEditingShift(null)}>Cancel</Button>
                <Button type="submit" loading={updateShift.isPending}>Save</Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
