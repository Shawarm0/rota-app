import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { useShiftsToCover } from "../../hooks/useDashboard";
import { useUpdateShift, useDeleteShift } from "../../hooks/useRotas";
import { useRequestCover } from "../../hooks/useShifts";
import { useUsers } from "../../hooks/useUsers";
import { useLocations } from "../../hooks/useLocations";
import { formatDate, formatDay } from "../../lib/dateUtils";
import { AlertCircle, Clock, MapPin, Trash2, Megaphone } from "lucide-react";
import type { ShiftToCover } from "../../api/dashboard.api";
import type { ShiftStatus } from "../../types";

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

export function ShiftsToCoverPage() {
  const { data: shifts, isLoading } = useShiftsToCover();
  const { data: employees } = useUsers("EMPLOYEE");
  const { data: locations } = useLocations();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const requestCover = useRequestCover();
  const [editingShift, setEditingShift] = useState<ShiftToCover | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const shiftForm = useForm<ShiftEditForm>();

  const handleEdit = (shift: ShiftToCover) => {
    setEditingShift(shift);
    setShowAdvanced(false);
    shiftForm.reset({
      startTime: shift.startTime,
      endTime: shift.endTime,
      userId: "",
      location: shift.location || "",
      notes: "",
      status: "AVAILABLE",
    });
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
    ...(employees?.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}${e.location ? ` (${e.location.name})` : ""}`,
    })) || []),
  ];

  const locationSelectOptions = [
    { value: "", label: "No location" },
    ...(locations?.map((l) => ({ value: l.name, label: l.name })) || []),
  ];

  return (
    <>
      <TopBar title="Shifts to Cover" />
      <div className="p-4 md:p-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !shifts?.length ? (
          <EmptyState
            icon={AlertCircle}
            title="No shifts to cover"
            description="All shifts are covered right now"
          />
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id} className="flex items-center justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleEdit(shift)}
              >
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
                  {(shift.location || shift.rota.location?.name) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {shift.location || shift.rota.location?.name}
                    </span>
                  )}
                </div>
                {shift.rota.name && (
                  <p className="text-xs text-gray-400 mt-0.5">{shift.rota.name}</p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => requestCover.mutate(shift.id)}
                loading={requestCover.isPending}
              >
                <Megaphone className="h-4 w-4 mr-1" /> Request Cover
              </Button>
            </Card>
          ))
        )}
      </div>

      <Modal open={!!editingShift} onClose={() => setEditingShift(null)} title="Assign / Edit Shift">
        <form onSubmit={shiftForm.handleSubmit(onSaveShift)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="startTime" label="Start Time" type="time" {...shiftForm.register("startTime", { required: true })} />
            <Input id="endTime" label="End Time" type="time" {...shiftForm.register("endTime", { required: true })} />
          </div>
          <Select id="userId" label="Assign Employee" options={employeeOptions} {...shiftForm.register("userId")} />
          <Select
            id="location"
            label="Location"
            options={locationSelectOptions}
            {...shiftForm.register("location")}
          />
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
    </>
  );
}
