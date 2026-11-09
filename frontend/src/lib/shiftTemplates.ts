import type { ShiftTemplate } from "../types";

// Fills a shift form from a template: times always, store and notes when the template has them
export function applyShiftTemplate(
  template: ShiftTemplate,
  setValue: (field: "startTime" | "endTime" | "location" | "notes", value: string) => void,
) {
  setValue("startTime", template.startTime);
  setValue("endTime", template.endTime);
  if (template.location) setValue("location", template.location.name);
  if (template.notes) setValue("notes", template.notes);
}
