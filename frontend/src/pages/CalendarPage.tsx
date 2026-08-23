import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { TopBar } from "../components/layout/TopBar";
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
import { useCategories } from "../hooks/useCategories";
import { useAuthStore } from "../stores/authStore";
import * as shiftApi from "../api/shift.api";
import * as userApi from "../api/user.api";
import { isSameDay, toDateString, formatDate } from "../lib/dateUtils";
import type { Shift, ShiftStatus } from "../types";
import clsx from "clsx";

const ALL_STATUSES: { value: ShiftStatus; label: string }[] = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ADDITIONAL", label: "Additional" },
  { value: "AVAILABLE", label: "Available" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const DEFAULT_CAT_COLOR = "#9CA3AF";

function getInitials(s: Shift): string {
  if (!s.user) return "—";
  return `${s.user.firstName[0]}${s.user.lastName[0]}`;
}

function getCatColor(s: Shift): string {
  return (s.user as any)?.category?.color || DEFAULT_CAT_COLOR;
}

function ShiftPill({ shift }: { shift: Shift }) {
  const catColor = getCatColor(shift);

  if (shift.status === "AVAILABLE") {
    return (
      <span className="inline-flex items-center rounded px-0.5 py-0 text-[9.5px] font-semibold border border-dashed border-gray-300 text-gray-400 bg-white leading-[16px]">
        Open
      </span>
    );
  }

  if (shift.status === "ADDITIONAL") {
    return (
      <span
        className="inline-flex items-center gap-[1px] rounded px-0.5 py-0 text-[9.5px] font-semibold leading-[16px]"
        style={{
          backgroundColor: `${catColor}18`,
          color: catColor,
          border: `1px solid ${catColor}40`,
        }}
      >
        +{getInitials(shift)}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded px-0.5 py-0 text-[9.5px] font-bold text-white leading-[16px]"
      style={{ backgroundColor: catColor }}
    >
      {getInitials(shift)}
    </span>
  );
}

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
  const { data: categories } = useCategories();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const shiftForm = useForm<ShiftEditForm>();

  const shifts = isManager ? allShifts : myShifts;
  const isLoading = isManager ? allLoading : myLoading;

  const startPadding = (firstDay.getDay() + 6) % 7;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getShiftsForDay = (day: Date) => shifts?.filter((s) => isSameDay(s.date, day)) || [];
  const getHolidaysForDay = (day: Date) => holidays?.filter((h) => isSameDay(h.date, day)) || [];

  const today = new Date();
  const monthLabel = currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const handleDayClick = (day: Date, dayShifts: Shift[]) => {
    const dayHolidays = getHolidaysForDay(day);
    if (dayShifts.length > 0 || dayHolidays.length > 0) {
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

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build week grid for desktop
  const weeks = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPadding; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const result: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [startPadding, daysInMonth]);

  return (
    <>
      <TopBar title="Calendar" subtitle="Rota & holiday overview" />
      <div className="p-4 md:p-7 max-w-[1400px]">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="w-[30px] h-[30px] rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-base font-bold text-gray-900 min-w-[150px] text-center">
                {monthLabel}
              </div>
              <button
                onClick={nextMonth}
                className="w-[30px] h-[30px] rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {isManager && locations && locations.length > 0 && (
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-white cursor-pointer outline-none"
                >
                  {locationOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 rotate-90 pointer-events-none" />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <>
              {/* Mobile grid view (Apple Calendar style) */}
              <div className="md:hidden">
                <div className="grid grid-cols-7">
                  {WEEKDAYS_SHORT.map((wd, i) => (
                    <div key={i} className="py-2 text-center text-[11px] font-semibold text-gray-400">
                      {wd}
                    </div>
                  ))}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-t border-gray-100">
                    {week.map((dayNum, di) => {
                      if (!dayNum) {
                        return <div key={`empty-${di}`} className="min-h-[72px]" />;
                      }
                      const day = new Date(year, month, dayNum);
                      const dayShifts = getShiftsForDay(day);
                      const dayHolidays = getHolidaysForDay(day);
                      const isToday = isSameDay(day, today);
                      const hasApprovedHoliday = dayHolidays.some((h) => h.status === "APPROVED");
                      const hasPendingHoliday = dayHolidays.some((h) => h.status === "PENDING");
                      const isWeekend = di >= 5;

                      return (
                        <div
                          key={dayNum}
                          className="min-h-[72px] px-[3px] pt-1 pb-1.5 cursor-pointer"
                          onClick={() => handleDayClick(day, dayShifts)}
                        >
                          <div className="flex justify-center mb-0.5">
                            {isToday ? (
                              <span className="w-[26px] h-[26px] rounded-full bg-red-500 text-white text-[13px] font-bold flex items-center justify-center">
                                {dayNum}
                              </span>
                            ) : (
                              <span className={clsx(
                                "w-[26px] h-[26px] text-[13px] font-semibold flex items-center justify-center",
                                isWeekend ? "text-gray-400" : hasApprovedHoliday ? "text-red-500" : "text-gray-800",
                              )}>
                                {dayNum}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-[2px] items-start overflow-hidden">
                            {dayHolidays.filter((h) => h.status === "APPROVED").slice(0, 1).map((h) => (
                              <span key={h.id} className="w-full rounded-[3px] bg-red-100 text-red-600 text-[8px] font-semibold leading-[16px] px-[3px] truncate">
                                {h.user ? h.user.firstName : "Off"}
                              </span>
                            ))}
                            {hasPendingHoliday && !hasApprovedHoliday && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto" />
                            )}
                            {dayShifts.slice(0, hasApprovedHoliday ? 1 : 2).map((s) => (
                              <ShiftPill key={s.id} shift={s} />
                            ))}
                            {dayShifts.length > (hasApprovedHoliday ? 1 : 2) && (
                              <span className="text-[8px] text-gray-400 font-medium w-full text-center">
                                +{dayShifts.length - (hasApprovedHoliday ? 1 : 2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Desktop grid view */}
              <div className="hidden md:block">
                <div className="grid grid-cols-7 border-b border-gray-200">
                  {WEEKDAYS.map((wd) => (
                    <div key={wd} className="py-2.5 text-center text-xs font-semibold text-gray-500">
                      {wd}
                    </div>
                  ))}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
                    {week.map((dayNum, di) => {
                      if (!dayNum) {
                        return <div key={`empty-${di}`} className="p-2.5 min-h-[80px] bg-white" />;
                      }
                      const day = new Date(year, month, dayNum);
                      const dayShifts = getShiftsForDay(day);
                      const dayHolidays = getHolidaysForDay(day);
                      const isToday = isSameDay(day, today);
                      const hasApprovedHoliday = dayHolidays.some((h) => h.status === "APPROVED");
                      const hasPendingHoliday = dayHolidays.some((h) => h.status === "PENDING");

                      let bg = "bg-white";
                      if (isToday) bg = "bg-indigo-50/60";
                      if (hasApprovedHoliday) bg = "bg-red-50/80";

                      return (
                        <div
                          key={dayNum}
                          className={clsx(
                            "p-2.5 min-h-[80px] border-l border-gray-100 first:border-l-0 cursor-pointer hover:bg-gray-50/50 transition-colors",
                            bg,
                          )}
                          onClick={() => handleDayClick(day, dayShifts)}
                        >
                          <div className={clsx(
                            "text-[13px]",
                            isToday ? "font-bold text-indigo-600" : hasApprovedHoliday ? "font-bold text-red-500" : "font-medium text-gray-800",
                          )}>
                            {dayNum}
                          </div>
                          {dayHolidays.filter((h) => h.status === "APPROVED").map((h) => (
                            <div key={h.id} className="text-[11.5px] font-semibold text-red-500 mt-0.5 truncate">
                              {h.user ? h.user.firstName : "Holiday"}
                            </div>
                          ))}
                          {dayShifts.length > 0 && (
                            <div className="flex flex-col gap-[3px] mt-1">
                              {dayShifts.slice(0, 3).map((s) => (
                                <ShiftPill key={s.id} shift={s} />
                              ))}
                              {dayShifts.length > 3 && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  +{dayShifts.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          {hasPendingHoliday && dayShifts.length === 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 block" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Legend */}
          <div className="flex items-center gap-5 flex-wrap px-5 py-4 border-t border-gray-200">
            {categories?.map((c) => (
              <div key={c.id} className="flex items-center gap-[7px] text-[12.5px] text-gray-600">
                <span className="inline-flex items-center rounded px-1 py-0 text-[9px] font-bold text-white leading-[16px]" style={{ backgroundColor: c.color }}>
                  AB
                </span>
                {c.name}
              </div>
            ))}
            <div className="flex items-center gap-[7px] text-[12.5px] text-gray-600">
              <span className="inline-flex items-center rounded px-1 py-0 text-[9px] font-bold text-white leading-[16px]" style={{ backgroundColor: DEFAULT_CAT_COLOR }}>
                AB
              </span>
              Uncategorized
            </div>
            <div className="flex items-center gap-[7px] text-[12.5px] text-gray-600">
              <span className="inline-flex items-center rounded px-1 py-0 text-[9px] font-semibold leading-[16px]" style={{ backgroundColor: `${DEFAULT_CAT_COLOR}18`, color: DEFAULT_CAT_COLOR, border: `1px solid ${DEFAULT_CAT_COLOR}40` }}>
                +AB
              </span>
              Additional
            </div>
            <div className="flex items-center gap-[7px] text-[12.5px] text-gray-600">
              <span className="inline-flex items-center rounded px-1 py-0 text-[9px] font-semibold border border-dashed border-gray-300 text-gray-400 bg-white leading-[16px]">
                Open
              </span>
              Available
            </div>
            <div className="flex items-center gap-[7px] text-[12.5px] text-gray-600">
              <span className="w-2 h-2 rounded-full shrink-0 bg-red-400" />
              Approved holiday
            </div>
            <div className="flex items-center gap-[7px] text-[12.5px] text-gray-600">
              <span className="w-2 h-2 rounded-full shrink-0 bg-amber-400" />
              Requested holiday
            </div>
          </div>
        </div>
      </div>

      {/* Shift details modal */}
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

      {/* Edit shift modal */}
      {isManager && (
        <Modal open={!!editingShift} onClose={() => setEditingShift(null)} title="Edit Shift">
          <form onSubmit={shiftForm.handleSubmit(onSaveShift)} className="flex flex-col gap-4">
            <Input id="startTime" label="Start Time" type="time" {...shiftForm.register("startTime", { required: true })} />
            <Input id="endTime" label="End Time" type="time" {...shiftForm.register("endTime", { required: true })} />
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
                className="text-[13px] text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {showAdvanced ? "Hide Advanced" : "Advanced"}
              </button>
              {showAdvanced && (
                <div className="mt-3">
                  <Select
                    id="status"
                    label="Status"
                    options={ALL_STATUSES}
                    {...shiftForm.register("status")}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
              <Button
                variant="danger"
                type="button"
                onClick={() => {
                  deleteShift.mutate(editingShift!.id);
                  setEditingShift(null);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
              <div className="flex gap-2.5">
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
