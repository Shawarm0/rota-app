import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const shiftTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: z.string().regex(timeRegex, "Must be HH:MM format"),
  endTime: z.string().regex(timeRegex, "Must be HH:MM format"),
  notes: z.string().max(500).optional().nullable(),
  // Empty for a template that applies to every store
  locationId: z.string().optional().nullable(),
});
