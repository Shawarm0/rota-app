import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { useCreateAdditionalShift } from "../../hooks/useShifts";
import { useUsers } from "../../hooks/useUsers";
import { useLocations } from "../../hooks/useLocations";

interface AdditionalShiftForm {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
}

export function AdditionalShiftModal({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate?: string }) {
  const { data: employees } = useUsers("EMPLOYEE");
  const { data: locations } = useLocations();
  const createAdditionalShift = useCreateAdditionalShift();
  const form = useForm<AdditionalShiftForm>();

  useEffect(() => {
    if (open) form.reset({ userId: "", date: defaultDate ?? "", startTime: "", endTime: "", location: "", notes: "" });
  }, [open, defaultDate, form]);

  return (
    <Modal open={open} onClose={onClose} title="Add Additional Shift">
      <form
        onSubmit={form.handleSubmit((data) => {
          createAdditionalShift.mutate(
            { ...data, location: data.location || undefined, notes: data.notes || undefined },
            { onSuccess: onClose },
          );
        })}
        className="flex flex-col gap-4"
      >
        <Select
          id="userId"
          label="Employee"
          options={[
            { value: "", label: "Select employee..." },
            ...(employees
              ?.filter((e) => e.active !== false)
              .map((e) => ({
                value: e.id,
                label: `${e.firstName} ${e.lastName}${e.location ? ` (${e.location.name})` : ""}`,
              })) || []),
          ]}
          {...form.register("userId", { required: true })}
        />
        <Input id="date" label="Date" type="date" {...form.register("date", { required: true })} />
        <Input id="startTime" label="Start Time" type="time" {...form.register("startTime", { required: true })} />
        <Input id="endTime" label="End Time" type="time" {...form.register("endTime", { required: true })} />
        <Select
          id="location"
          label="Location"
          options={[
            { value: "", label: "No location" },
            ...(locations?.map((l) => ({ value: l.name, label: l.name })) || []),
          ]}
          {...form.register("location")}
        />
        <Input id="notes" label="Notes (optional)" {...form.register("notes")} />
        <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createAdditionalShift.isPending}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}
