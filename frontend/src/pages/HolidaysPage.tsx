import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { RoleGate } from "../components/auth/RoleGate";
import { useHolidayRequests, useRequestHoliday, useCancelHoliday, useUpdateHoliday, useDeleteHoliday } from "../hooks/useHolidays";
import { formatDate } from "../lib/dateUtils";
import { Palmtree, Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import type { HolidayStatus, HolidayRequest } from "../types";

const statusVariants: Record<HolidayStatus, "yellow" | "green" | "red" | "gray"> = {
  PENDING: "yellow",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "gray",
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

  return (
    <>
      <TopBar title="Holidays" />
      <div className="p-4 md:p-6 space-y-4">
        <RoleGate allowedRoles={["EMPLOYEE"]}>
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Request Holiday
            </Button>
          </div>
        </RoleGate>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !requests?.length ? (
          <EmptyState icon={Palmtree} title="No holiday requests" />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="flex items-center justify-between">
                <div>
                  {req.user && (
                    <p className="text-sm font-medium text-gray-900">
                      {req.user.firstName} {req.user.lastName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">{formatDate(req.date)}</p>
                  {req.reason && <p className="text-xs text-gray-400">{req.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariants[req.status]}>{req.status}</Badge>
                  <RoleGate allowedRoles={["MANAGER"]}>
                    {req.status !== "APPROVED" && req.status !== "CANCELLED" && (
                      <button
                        onClick={() => updateMutation.mutate({ id: req.id, data: { status: "APPROVED" } })}
                        className="p-1.5 rounded-lg hover:bg-green-50"
                        title="Approve"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </button>
                    )}
                    {req.status !== "REJECTED" && req.status !== "CANCELLED" && (
                      <button
                        onClick={() => updateMutation.mutate({ id: req.id, data: { status: "REJECTED" } })}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                        title="Reject"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(req)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(req.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </RoleGate>
                  <RoleGate allowedRoles={["EMPLOYEE"]}>
                    {req.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelMutation.mutate(req.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </RoleGate>
                </div>
              </Card>
            ))}
          </div>
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
