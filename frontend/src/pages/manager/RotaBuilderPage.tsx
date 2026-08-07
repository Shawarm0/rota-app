import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { useRotas, useRota, useCreateRota, usePublishRota, useDeleteRota, useSyncShifts } from "../../hooks/useRotas";
import { useUsers } from "../../hooks/useUsers";
import { useLocations } from "../../hooks/useLocations";
import { addDays, toDateString, formatShortDate, formatDay } from "../../lib/dateUtils";
import { CalendarPlus, Plus, Send, Trash2, Copy, Save } from "lucide-react";
import type { Shift, ShiftStatus } from "../../types";
import clsx from "clsx";

const STATUS_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  ADDITIONAL: "bg-green-100 text-green-800 border-green-200",
  SWAP: "bg-purple-100 text-purple-800 border-purple-200",
  HOLIDAY: "bg-red-100 text-red-800 border-red-200",
  REQUESTED_HOLIDAY: "bg-yellow-100 text-yellow-800 border-yellow-200",
  AVAILABLE: "bg-gray-100 text-gray-800 border-gray-200",
  CANCELLED: "bg-gray-50 text-gray-500 border-gray-200",
};

const ALL_STATUSES: { value: ShiftStatus; label: string }[] = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ADDITIONAL", label: "Additional" },
  { value: "AVAILABLE", label: "Available" },
  { value: "SWAP", label: "Swap" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "REQUESTED_HOLIDAY", label: "Requested Holiday" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface LocalShift {
  localId: string;
  userId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
  status: ShiftStatus;
}

interface ShiftForm {
  startTime: string;
  endTime: string;
  userId: string;
  location: string;
  notes: string;
  status: ShiftStatus;
}

interface NewRotaForm {
  name: string;
  startDate: string;
  locationId: string;
}

let nextLocalId = 1;
function genLocalId() {
  return `local-${nextLocalId++}`;
}

function serverShiftsToLocal(shifts: Shift[]): LocalShift[] {
  return shifts.map((s) => ({
    localId: genLocalId(),
    userId: s.userId,
    date: toDateString(new Date(s.date)),
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    notes: s.notes,
    status: s.status,
  }));
}

export function RotaBuilderPage() {
  const { data: rotas } = useRotas();
  const { data: allEmployees } = useUsers("EMPLOYEE");
  const { data: locations } = useLocations();
  const [selectedRotaId, setSelectedRotaId] = useState<string | null>(null);
  const { data: selectedRota, isLoading: rotaLoading } = useRota(selectedRotaId);
  const createRota = useCreateRota();
  const publishRota = usePublishRota();
  const deleteRota = useDeleteRota();
  const syncShifts = useSyncShifts();

  const [showNewRota, setShowNewRota] = useState(false);
  const [editingShift, setEditingShift] = useState<{ date: string; shift?: LocalShift } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [copyTargetDays, setCopyTargetDays] = useState<string[]>([]);
  const [dragShift, setDragShift] = useState<LocalShift | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const newRotaForm = useForm<NewRotaForm>();
  const shiftForm = useForm<ShiftForm>();

  const [localShifts, setLocalShifts] = useState<LocalShift[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [serverSnapshotKey, setServerSnapshotKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRota?.shifts) {
      setLocalShifts([]);
      setHasUnsavedChanges(false);
      setServerSnapshotKey(null);
      return;
    }
    const key = selectedRota.shifts.map((s) => s.id).sort().join(",");
    if (key !== serverSnapshotKey) {
      setLocalShifts(serverShiftsToLocal(selectedRota.shifts));
      setHasUnsavedChanges(false);
      setServerSnapshotKey(key);
    }
  }, [selectedRota?.shifts, serverSnapshotKey]);

  const draftRotas = rotas?.filter((r) => r.status === "DRAFT") || [];

  const employees = useMemo(() => {
    if (!allEmployees) return [];
    if (!selectedRota?.locationId) return allEmployees;
    return allEmployees.filter((e) => e.locationId === selectedRota.locationId);
  }, [allEmployees, selectedRota?.locationId]);

  const days = useMemo(() => {
    if (!selectedRota) return [];
    const start = new Date(selectedRota.startDate);
    const end = new Date(selectedRota.endDate);
    const result: Date[] = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      result.push(new Date(d));
    }
    return result;
  }, [selectedRota]);

  const getShiftsForCell = (employeeId: string, date: string) =>
    localShifts.filter((s) => s.userId === employeeId && s.date === date);

  const onCreateRota = (data: NewRotaForm) => {
    const start = new Date(data.startDate);
    const end = addDays(start, 13);
    createRota.mutate(
      {
        name: data.name || undefined,
        startDate: data.startDate,
        endDate: toDateString(end),
        locationId: data.locationId || undefined,
      },
      {
        onSuccess: (rota) => {
          setSelectedRotaId(rota.id);
          setShowNewRota(false);
          newRotaForm.reset();
        },
      },
    );
  };

  const addLocalShift = (shift: Omit<LocalShift, "localId">) => {
    setLocalShifts((prev) => [...prev, { ...shift, localId: genLocalId() }]);
    setHasUnsavedChanges(true);
  };

  const updateLocalShift = (localId: string, updates: Partial<LocalShift>) => {
    setLocalShifts((prev) =>
      prev.map((s) => (s.localId === localId ? { ...s, ...updates } : s)),
    );
    setHasUnsavedChanges(true);
  };

  const deleteLocalShift = (localId: string) => {
    setLocalShifts((prev) => prev.filter((s) => s.localId !== localId));
    setHasUnsavedChanges(true);
  };

  const onSaveShift = (data: ShiftForm) => {
    if (!editingShift) return;
    if (editingShift.shift) {
      updateLocalShift(editingShift.shift.localId, {
        startTime: data.startTime,
        endTime: data.endTime,
        userId: data.userId || null,
        location: data.location || null,
        notes: data.notes || null,
        status: data.status,
      });
    } else {
      addLocalShift({
        date: editingShift.date,
        startTime: data.startTime,
        endTime: data.endTime,
        userId: data.userId || null,
        location: data.location || null,
        notes: data.notes || null,
        status: data.status,
      });
    }
    setEditingShift(null);
  };

  const handleDrop = useCallback(
    (targetEmployeeId: string, targetDate: string) => {
      if (!dragShift) return;
      addLocalShift({
        date: targetDate,
        startTime: dragShift.startTime,
        endTime: dragShift.endTime,
        userId: targetEmployeeId,
        location: dragShift.location,
        notes: dragShift.notes,
        status: dragShift.status,
      });
      setDragShift(null);
      setDragOverCell(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragShift],
  );

  const handleCopyToDays = () => {
    if (!editingShift?.shift || copyTargetDays.length === 0) return;
    const shift = editingShift.shift;
    for (const targetDate of copyTargetDays) {
      addLocalShift({
        date: targetDate,
        startTime: shift.startTime,
        endTime: shift.endTime,
        userId: shift.userId,
        location: shift.location,
        notes: shift.notes,
        status: shift.status,
      });
    }
    setCopyTargetDays([]);
    setShowCopy(false);
    setEditingShift(null);
  };

  const handleSaveDraft = () => {
    if (!selectedRotaId) return;
    syncShifts.mutate(
      {
        rotaId: selectedRotaId,
        shifts: localShifts.map((s) => ({
          userId: s.userId,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
          notes: s.notes,
          status: s.status,
        })),
      },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          setServerSnapshotKey(null);
        },
      },
    );
  };

  const handlePublish = () => {
    if (!selectedRotaId) return;
    if (hasUnsavedChanges) {
      syncShifts.mutate(
        {
          rotaId: selectedRotaId,
          shifts: localShifts.map((s) => ({
            userId: s.userId,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            location: s.location,
            notes: s.notes,
            status: s.status,
          })),
        },
        {
          onSuccess: () => {
            setHasUnsavedChanges(false);
            setServerSnapshotKey(null);
            publishRota.mutate(selectedRotaId);
          },
        },
      );
    } else {
      publishRota.mutate(selectedRotaId);
    }
  };

  const employeeOptions = [
    { value: "", label: "Unassigned" },
    ...(allEmployees?.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}${e.location ? ` (${e.location.name})` : ""}`,
    })) || []),
  ];

  const locationOptions = [
    { value: "", label: "All locations" },
    ...(locations?.map((l) => ({ value: l.id, label: l.name })) || []),
  ];

  const rotaLocationName = selectedRota?.location?.name;

  return (
    <>
      <TopBar title="Rota Builder" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={[
              { value: "", label: "Select a rota..." },
              ...draftRotas.map((r) => ({
                value: r.id,
                label: `${r.name || `${formatShortDate(r.startDate)} - ${formatShortDate(r.endDate)}`}${r.location ? ` · ${r.location.name}` : ""}`,
              })),
            ]}
            value={selectedRotaId || ""}
            onChange={(e) => setSelectedRotaId(e.target.value || null)}
            className="w-72"
          />
          <Button variant="secondary" size="sm" onClick={() => setShowNewRota(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Rota
          </Button>
          {selectedRota && selectedRota.status === "DRAFT" && (
            <>
              <Button
                size="sm"
                onClick={handleSaveDraft}
                loading={syncShifts.isPending}
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-1" /> Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                loading={publishRota.isPending || syncShifts.isPending}
              >
                <Send className="h-4 w-4 mr-1" /> Publish
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteRota.mutate(selectedRotaId!, { onSuccess: () => setSelectedRotaId(null) });
                }}
                loading={deleteRota.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </>
          )}
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-yellow-400" />
            <span className="text-xs text-yellow-700 font-medium">You have unsaved changes</span>
          </div>
        )}

        {selectedRota?.location && (
          <div className="flex items-center gap-2">
            <Badge variant="blue">{selectedRota.location.name}</Badge>
            <span className="text-xs text-gray-500">
              Showing {employees.length} employee{employees.length !== 1 ? "s" : ""} at this location
            </span>
          </div>
        )}

        {!selectedRotaId ? (
          <EmptyState
            icon={CalendarPlus}
            title="Select or create a rota"
            description="Choose a draft rota to edit or create a new one"
          />
        ) : rotaLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : selectedRota && selectedRota.status === "PUBLISHED" ? (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="green">Published</Badge>
              <p className="text-sm text-gray-500">This rota is published and cannot be edited</p>
            </div>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 bg-white px-3 py-2 text-left font-medium text-gray-600 min-w-[120px]">
                      Employee
                    </th>
                    {days.map((day) => (
                      <th
                        key={day.toISOString()}
                        className="px-1 py-2 text-center font-medium text-gray-600 min-w-[80px]"
                      >
                        <div>{formatDay(day)}</div>
                        <div className="text-gray-400">{day.getDate()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees?.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50/50">
                      <td className="sticky left-0 bg-white px-3 py-2 font-medium text-gray-900">
                        <div>{emp.firstName} {emp.lastName}</div>
                        {emp.location && (
                          <div className="text-[10px] text-gray-400">{emp.location.name}</div>
                        )}
                      </td>
                      {days.map((day) => {
                        const dateStr = toDateString(day);
                        const shifts = getShiftsForCell(emp.id, dateStr);
                        return (
                          <td
                            key={dateStr}
                            className={clsx(
                              "px-1 py-1 text-center",
                              dragOverCell === `${emp.id}-${dateStr}` && "bg-blue-50 ring-2 ring-inset ring-blue-300 rounded",
                            )}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverCell(`${emp.id}-${dateStr}`);
                            }}
                            onDragLeave={() => setDragOverCell(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDrop(emp.id, dateStr);
                            }}
                          >
                            <div className="space-y-0.5">
                              {shifts.map((s) => (
                                <button
                                  key={s.localId}
                                  draggable
                                  onDragStart={(e) => {
                                    setDragShift(s);
                                    e.dataTransfer.effectAllowed = "copy";
                                  }}
                                  onDragEnd={() => { setDragShift(null); setDragOverCell(null); }}
                                  onClick={() => {
                                    setEditingShift({ date: dateStr, shift: s });
                                    setShowAdvanced(false);
                                    setShowCopy(false);
                                    setCopyTargetDays([]);
                                    shiftForm.reset({
                                      startTime: s.startTime,
                                      endTime: s.endTime,
                                      userId: s.userId || "",
                                      location: s.location || "",
                                      notes: s.notes || "",
                                      status: s.status,
                                    });
                                  }}
                                  className={clsx(
                                    "block w-full rounded px-1 py-0.5 text-[10px] font-medium border truncate cursor-grab active:cursor-grabbing",
                                    STATUS_COLORS[s.status],
                                  )}
                                >
                                  {s.startTime}-{s.endTime}
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  setEditingShift({ date: dateStr });
                                  setShowAdvanced(false);
                                  setShowCopy(false);
                                  setCopyTargetDays([]);
                                  shiftForm.reset({
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    userId: emp.id,
                                    location: rotaLocationName || "",
                                    notes: "",
                                    status: "ASSIGNED",
                                  });
                                }}
                                className="block w-full rounded border border-dashed border-gray-200 py-0.5 text-[10px] text-gray-400 hover:bg-gray-50 hover:border-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={showNewRota} onClose={() => setShowNewRota(false)} title="New Rota">
        <form onSubmit={newRotaForm.handleSubmit(onCreateRota)} className="space-y-4">
          <Input id="rotaName" label="Name (optional)" {...newRotaForm.register("name")} />
          <Input id="startDate" label="Start Date (Monday)" type="date" {...newRotaForm.register("startDate", { required: true })} />
          <Select
            id="locationId"
            label="Store Location (optional)"
            options={locationOptions}
            {...newRotaForm.register("locationId")}
          />
          <p className="text-xs text-gray-500">
            Rota will span 2 weeks. If a location is set, only employees at that store will be shown.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowNewRota(false)}>Cancel</Button>
            <Button type="submit" loading={createRota.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editingShift} onClose={() => setEditingShift(null)} title={editingShift?.shift ? "Edit Shift" : "Add Shift"}>
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
          {editingShift?.shift && (
            <div>
              <button
                type="button"
                onClick={() => { setShowCopy(!showCopy); setCopyTargetDays([]); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> {showCopy ? "Hide Copy" : "Copy to other days"}
              </button>
              {showCopy && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-500">Select days to copy this shift to:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {days.map((day) => {
                      const ds = toDateString(day);
                      const isSelected = copyTargetDays.includes(ds);
                      const isCurrent = ds === editingShift.date;
                      return (
                        <button
                          key={ds}
                          type="button"
                          disabled={isCurrent}
                          onClick={() =>
                            setCopyTargetDays((prev) =>
                              isSelected ? prev.filter((d) => d !== ds) : [...prev, ds],
                            )
                          }
                          className={clsx(
                            "px-2 py-1 rounded text-[11px] font-medium border transition-colors",
                            isCurrent && "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed",
                            !isCurrent && isSelected && "bg-blue-100 text-blue-800 border-blue-300",
                            !isCurrent && !isSelected && "bg-white text-gray-600 border-gray-200 hover:border-blue-300",
                          )}
                        >
                          {formatDay(day)} {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={copyTargetDays.length === 0}
                    onClick={handleCopyToDays}
                  >
                    Copy to {copyTargetDays.length} day{copyTargetDays.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between">
            {editingShift?.shift && (
              <Button
                variant="danger"
                type="button"
                size="sm"
                onClick={() => {
                  deleteLocalShift(editingShift.shift!.localId);
                  setEditingShift(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" type="button" onClick={() => setEditingShift(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
