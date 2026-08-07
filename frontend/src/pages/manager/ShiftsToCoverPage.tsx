import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
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

  const count = shifts?.length || 0;

  return (
    <>
      <TopBar title="Shifts to Cover" subtitle={`${count} open shift${count !== 1 ? "s" : ""}`} />
      <div className="p-4 md:px-7 md:py-5 flex flex-col gap-3 max-w-[1200px]">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !shifts?.length ? (
          <EmptyState
            icon={AlertCircle}
            title="No shifts to cover"
            description="All shifts are covered right now"
          />
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-[18px] flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0 cursor-pointer" onClick={() => handleEdit(shift)}>
                <div className="flex items-center gap-[10px] flex-wrap">
                  <div className="text-[14.5px] font-semibold text-gray-900">
                    {formatDay(shift.date)} {formatDate(shift.date)}
                  </div>
                  <span className="text-[11.5px] font-semibold px-[9px] py-[3px] rounded-full bg-gray-100 text-gray-500">Available</span>
                </div>
                <div className="flex items-center gap-[14px] mt-[6px] flex-wrap">
                  <span className="flex items-center gap-[5px] text-[13px] text-gray-500">
                    <Clock className="h-[14px] w-[14px]" />
                    {shift.startTime} - {shift.endTime}
                  </span>
                  {(shift.location || shift.rota.location?.name) && (
                    <span className="flex items-center gap-[5px] text-[13px] text-gray-500">
                      <MapPin className="h-[14px] w-[14px]" />
                      {shift.location || shift.rota.location?.name}
                    </span>
                  )}
                </div>
                {shift.rota.name && (
                  <p className="text-[12px] text-gray-400 mt-1">{shift.rota.name}</p>
                )}
              </div>
              <button
                onClick={() => requestCover.mutate(shift.id)}
                disabled={requestCover.isPending}
                className="flex items-center gap-[7px] bg-gray-100 text-gray-800 border border-gray-200 rounded-lg px-[14px] py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
              >
                <Megaphone className="h-[15px] w-[15px]" /> Request Cover
              </button>
            </div>
          ))
        )}
      </div>

      <Modal open={!!editingShift} onClose={() => setEditingShift(null)} title="Assign / Edit Shift">
        <form onSubmit={shiftForm.handleSubmit(onSaveShift)} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <Input id="startTime" label="Start Time" type="time" {...shiftForm.register("startTime", { required: true })} />
            </div>
            <div className="flex-1 min-w-0">
              <Input id="endTime" label="End Time" type="time" {...shiftForm.register("endTime", { required: true })} />
            </div>
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
