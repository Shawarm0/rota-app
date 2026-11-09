import { Select } from "../ui/Select";
import { useShiftTemplates } from "../../hooks/useShiftTemplates";
import { usePermissions } from "../../hooks/usePermissions";
import type { ShiftTemplate } from "../../types";

// "Use a template" dropdown for shift forms. Offers all-store templates plus those for stores this person
// can change, narrowed to the shift's store once one is chosen. Picking one hands it to onPick to fill the form.
export function ShiftTemplatePicker({ store, onPick }: { store?: string | null; onPick: (template: ShiftTemplate) => void }) {
  const { data: templates } = useShiftTemplates();
  const { canEditStoreId } = usePermissions();

  const usable = (templates ?? []).filter(
    (t) => (!t.locationId || canEditStoreId(t.locationId)) && (!store || !t.location || t.location.name === store),
  );
  if (usable.length === 0) return null;

  return (
    <Select
      id="shiftTemplate"
      label="Use a template"
      value=""
      onChange={(e) => {
        const template = usable.find((t) => t.id === e.target.value);
        if (template) onPick(template);
      }}
      options={[
        { value: "", label: "Choose a template…" },
        ...usable.map((t) => ({
          value: t.id,
          label: `${t.name} · ${t.startTime}–${t.endTime}${t.location ? ` · ${t.location.name}` : ""}`,
        })),
      ]}
    />
  );
}
