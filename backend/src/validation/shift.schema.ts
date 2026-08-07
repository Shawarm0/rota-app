import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createShiftSchema = z.object({
  userId: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex, "Must be HH:MM format"),
  endTime: z.string().regex(timeRegex, "Must be HH:MM format"),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ASSIGNED", "ADDITIONAL", "AVAILABLE"]).optional(),
});

export const updateShiftSchema = createShiftSchema.partial();

export const bulkCreateShiftsSchema = z.object({
  shifts: z.array(createShiftSchema).min(1),
});
