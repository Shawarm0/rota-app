import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { RoleGate } from "../components/auth/RoleGate";
import { useHolidayRequests, useRequestHoliday, useCancelHoliday, useUpdateHoliday, useDeleteHoliday } from "../hooks/useHolidays";
import { formatDate } from "../lib/dateUtils";
import { Palmtree, Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import type { HolidayStatus, HolidayRequest } from "../types";

const STATUS_STYLES: Record<HolidayStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<HolidayStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

interface HolidayForm {
  date: string;
  days: string;
  reason: string;
}

interface EditHolidayForm {
  date: string;
  reason: string;
  status: string;
}

export function HolidaysPage() {
  const { data: requests, isLoading } = useHolidayRequests();
  const requestMutation = useRequestHoliday();
  const cancelMutation = useCancelHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayRequest | null>(null);
  const { register, handleSubmit, reset } = useForm<HolidayForm>();
  const editForm = useForm<EditHolidayForm>();

  const onSubmit = (data: HolidayForm) => {
    const days = parseInt(data.days) || 1;
    requestMutation.mutate(
      { date: data.date, days, reason: data.reason || undefined },
      { onSuccess: () => { setShowForm(false); reset(); } },
    );
  };

  const handleEdit = (req: HolidayRequest) => {
    setEditingHoliday(req);
    const dateStr = typeof req.date === "string"
      ? req.date.split("T")[0]
      : new Date(req.date).toISOString().split("T")[0];
    editForm.reset({
      date: dateStr,
      reason: req.reason || "",
      status: req.status,
    });
  };

  const onEditSubmit = (data: EditHolidayForm) => {
    if (!editingHoliday) return;
    updateMutation.mutate(
      {
        id: editingHoliday.id,
        data: {
          date: data.date,
          reason: data.reason || null,
          ...(data.status !== editingHoliday.status ? { status: data.status } : {}),
        },
      },
      { onSuccess: () => setEditingHoliday(null) },
    );
  };

  const count = requests?.length || 0;

  return (
    <>
      <TopBar
        title="Holidays"
        subtitle={`${count} request${count !== 1 ? "s" : ""}`}
        actions={
          <RoleGate allowedRoles={["EMPLOYEE"]}>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-[7px] bg-indigo-600 text-white rounded-lg px-4 py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <Plus className="h-[15px] w-[15px]" /> Request Holiday
            </button>
          </RoleGate>
        }
      />
      <div className="p-4 md:px-7 md:py-5 flex flex-col gap-3 max-w-[1200px]">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !requests?.length ? (
          <EmptyState icon={Palmtree} title="No holiday requests" />
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-[18px] flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-[10px] flex-wrap">
                  <div className="text-[14.5px] font-semibold text-gray-900">
                    {formatDate(req.date)}
                  </div>
                  <span className={`text-[11.5px] font-semibold px-[9px] py-[3px] rounded-full ${STATUS_STYLES[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                {req.user && (
                  <div className="text-[13px] text-gray-500 mt-[4px]">
                    {req.user.firstName} {req.user.lastName}
                  </div>
                )}
                {req.reason && (
                  <p className="text-[12px] text-gray-400 mt-1">{req.reason}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <RoleGate allowedRoles={["MANAGER"]}>
                  {req.status !== "APPROVED" && req.status !== "CANCELLED" && (
                    <button
                      onClick={() => updateMutation.mutate({ id: req.id, data: { status: "APPROVED" } })}
                      className="h-8 w-8 rounded-[7px] border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors"
                      title="Approve"
                    >
                      <Check className="h-[15px] w-[15px] text-green-600" />
                    </button>
                  )}
                  {req.status !== "REJECTED" && req.status !== "CANCELLED" && (
                    <button
                      onClick={() => updateMutation.mutate({ id: req.id, data: { status: "REJECTED" } })}
                      className="h-8 w-8 rounded-[7px] border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Reject"
                    >
                      <X className="h-[15px] w-[15px] text-red-500" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(req)}
                    className="h-8 w-8 rounded-[7px] border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-[15px] w-[15px] text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(req.id)}
                    className="h-8 w-8 rounded-[7px] border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-[15px] w-[15px] text-red-500" />
                  </button>
                </RoleGate>
                <RoleGate allowedRoles={["EMPLOYEE"]}>
                  {req.status === "PENDING" && (
                    <button
                      onClick={() => cancelMutation.mutate(req.id)}
                      className="flex items-center gap-[7px] bg-gray-100 text-gray-800 border border-gray-200 rounded-lg px-[14px] py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  )}
                </RoleGate>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Request Holiday">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input id="date" label="Start Date" type="date" {...register("date", { required: true })} />
          <Select
            id="days"
            label="Number of Days"
            options={[
              { value: "1", label: "1 day" },
              { value: "2", label: "2 days" },
              { value: "3", label: "3 days" },
              { value: "4", label: "4 days" },
              { value: "5", label: "5 days" },
            ]}
            {...register("days")}
          />
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-gray-700">Reason (optional)</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              {...register("reason")}
            />
          </div>
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={requestMutation.isPending}>Submit</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editingHoliday} onClose={() => setEditingHoliday(null)} title="Edit Holiday">
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
          <Input id="editDate" label="Date" type="date" {...editForm.register("date", { required: true })} />
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-gray-700">Reason</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[70px] resize-y"
              {...editForm.register("reason")}
            />
          </div>
          <RoleGate allowedRoles={["MANAGER"]}>
            <Select
              id="editStatus"
              label="Status"
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
              ]}
              {...editForm.register("status")}
            />
          </RoleGate>
          {editingHoliday?.user && (
            <p className="text-[13px] text-gray-500">
              {editingHoliday.user.firstName} {editingHoliday.user.lastName}
            </p>
          )}
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setEditingHoliday(null)}>Cancel</Button>
            <Button type="submit" loading={updateMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
