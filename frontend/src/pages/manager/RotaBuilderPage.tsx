import { useState, useMemo } from "react";
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
import { useRotas, useRota, useCreateRota, usePublishRota, useDeleteRota, useCreateShift, useUpdateShift, useDeleteShift } from "../../hooks/useRotas";
import { useUsers } from "../../hooks/useUsers";
import { useLocations } from "../../hooks/useLocations";
import { addDays, toDateString, formatShortDate, formatDay } from "../../lib/dateUtils";
import { CalendarPlus, Plus, Send, Trash2 } from "lucide-react";
import type { Shift, ShiftStatus } from "../../types";
import clsx from "clsx";

const STATUS_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  ADDITIONAL: "bg-green-100 text-green-800 border-green-200",
  HOLIDAY: "bg-red-100 text-red-800 border-red-200",
  REQUESTED_HOLIDAY: "bg-yellow-100 text-yellow-800 border-yellow-200",
  AVAILABLE: "bg-gray-100 text-gray-800 border-gray-200",
  CANCELLED: "bg-gray-50 text-gray-500 border-gray-200",
};

interface ShiftForm {
  startTime: string;
  endTime: string;
  userId: string;
  location: string;
  notes: string;
}

interface NewRotaForm {
  name: string;
  startDate: string;
  locationId: string;
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
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const [showNewRota, setShowNewRota] = useState(false);
  const [editingShift, setEditingShift] = useState<{ date: string; shift?: Shift } | null>(null);
  const newRotaForm = useForm<NewRotaForm>();
  const shiftForm = useForm<ShiftForm>();

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
    selectedRota?.shifts?.filter(
      (s) => s.userId === employeeId && toDateString(new Date(s.date)) === date,
    ) || [];

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

  const onSaveShift = (data: ShiftForm) => {
    if (!editingShift || !selectedRotaId) return;
    if (editingShift.shift) {
      updateShift.mutate(
        { id: editingShift.shift.id, data: { ...data, userId: data.userId || null } },
        { onSuccess: () => setEditingShift(null) },
      );
    } else {
      createShift.mutate(
        { rotaId: selectedRotaId, shift: { ...data, date: editingShift.date, userId: data.userId || null } },
        { onSuccess: () => setEditingShift(null) },
      );
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
                onClick={() => publishRota.mutate(selectedRotaId!)}
                loading={publishRota.isPending}
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
                          <td key={dateStr} className="px-1 py-1 text-center">
                            <div className="space-y-0.5">
                              {shifts.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    setEditingShift({ date: dateStr, shift: s });
                                    shiftForm.reset({
                                      startTime: s.startTime,
                                      endTime: s.endTime,
                                      userId: s.userId || "",
                                      location: s.location || "",
                                      notes: s.notes || "",
                                    });
                                  }}
                                  className={clsx(
                                    "block w-full rounded px-1 py-0.5 text-[10px] font-medium border truncate",
                                    STATUS_COLORS[s.status],
                                  )}
                                >
                                  {s.startTime}-{s.endTime}
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  setEditingShift({ date: dateStr });
                                  shiftForm.reset({
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    userId: emp.id,
                                    location: rotaLocationName || "",
                                    notes: "",
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
          <div className="flex justify-between">
            {editingShift?.shift && (
              <Button
                variant="danger"
                type="button"
                size="sm"
                onClick={() => {
                  deleteShift.mutate(editingShift.shift!.id);
                  setEditingShift(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" type="button" onClick={() => setEditingShift(null)}>Cancel</Button>
              <Button type="submit" loading={createShift.isPending || updateShift.isPending}>Save</Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
