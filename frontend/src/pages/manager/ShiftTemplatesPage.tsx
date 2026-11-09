import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { useShiftTemplates, useCreateShiftTemplate, useUpdateShiftTemplate, useDeleteShiftTemplate } from "../../hooks/useShiftTemplates";
import { useLocations } from "../../hooks/useLocations";
import { usePermissions } from "../../hooks/usePermissions";
import { Clock, MapPin, Pencil, Plus, Trash2, LayoutTemplate } from "lucide-react";
import type { ShiftTemplate } from "../../types";

interface TemplateForm {
  name: string;
  startTime: string;
  endTime: string;
  locationId: string;
  notes: string;
}

export function ShiftTemplatesPage() {
  const { data: templates, isLoading } = useShiftTemplates();
  const { data: locations } = useLocations();
  const { isOwner, canEditStoreId, storeOptions } = usePermissions();
  const createTemplate = useCreateShiftTemplate();
  const updateTemplate = useUpdateShiftTemplate();
  const deleteTemplate = useDeleteShiftTemplate();
  // null = closed, "new" = creating, otherwise the template being edited
  const [editing, setEditing] = useState<ShiftTemplate | "new" | null>(null);
  const form = useForm<TemplateForm>();

  // All-store templates are the owner's; store managers manage templates for stores they can edit
  const canManage = (t: ShiftTemplate) => (t.locationId ? canEditStoreId(t.locationId) : isOwner);
  const storeSelectOptions = storeOptions(locations, "id").map((o) => (o.value ? o : { ...o, label: "All stores" }));

  const open = (template: ShiftTemplate | "new") => {
    setEditing(template);
    form.reset(
      template === "new"
        ? { name: "", startTime: "", endTime: "", locationId: storeSelectOptions[0]?.value ?? "", notes: "" }
        : {
            name: template.name,
            startTime: template.startTime,
            endTime: template.endTime,
            locationId: template.locationId ?? "",
            notes: template.notes ?? "",
          },
    );
  };

  const onSubmit = (data: TemplateForm) => {
    const input = { ...data, locationId: data.locationId || null, notes: data.notes || null };
    const done = { onSuccess: () => setEditing(null) };
    if (editing === "new") createTemplate.mutate(input, done);
    else if (editing) updateTemplate.mutate({ id: editing.id, data: input }, done);
  };

  return (
    <>
      <TopBar
        title="Shift Templates"
        subtitle="Presets for quickly filling in shifts"
        actions={
          <button
            onClick={() => open("new")}
            className="flex items-center gap-[7px] bg-indigo-600 text-white rounded-lg px-4 py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <Plus className="h-[15px] w-[15px]" /> New Template
          </button>
        }
      />
      <div className="p-4 md:px-7 md:py-5 max-w-[1000px] flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !templates?.length ? (
          <EmptyState
            icon={LayoutTemplate}
            title="No shift templates"
            description="Create templates like “Morning 09:00–17:00” to fill in shifts in one click"
          />
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-[16px] flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold text-gray-900">{t.name}</div>
                <div className="flex items-center gap-[14px] mt-[6px] flex-wrap text-[13px] text-gray-500">
                  <span className="flex items-center gap-[5px]">
                    <Clock className="h-[14px] w-[14px]" />
                    {t.startTime} – {t.endTime}
                  </span>
                  <span className="flex items-center gap-[5px]">
                    <MapPin className="h-[14px] w-[14px]" />
                    {t.location?.name ?? "All stores"}
                  </span>
                </div>
                {t.notes && <p className="text-[12px] text-gray-400 mt-1">{t.notes}</p>}
              </div>
              {canManage(t) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => open(t)}
                    className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-indigo-50 text-gray-500 hover:text-indigo-600"
                    title="Edit template"
                  >
                    <Pencil className="h-[15px] w-[15px]" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete the "${t.name}" template?`)) deleteTemplate.mutate(t.id);
                    }}
                    className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-500"
                    title="Delete template"
                  >
                    <Trash2 className="h-[15px] w-[15px]" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New Template" : "Edit Template"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input id="templateName" label="Name" placeholder="e.g. Morning" {...form.register("name", { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="templateStart" label="Start Time" type="time" {...form.register("startTime", { required: true })} />
            <Input id="templateEnd" label="End Time" type="time" {...form.register("endTime", { required: true })} />
          </div>
          <Select id="templateStore" label="Store" options={storeSelectOptions} {...form.register("locationId")} />
          <Input id="templateNotes" label="Notes (optional)" {...form.register("notes")} />
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={createTemplate.isPending || updateTemplate.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
