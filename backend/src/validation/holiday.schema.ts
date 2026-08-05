import { z } from "zod";

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shiftId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const rejectHolidaySchema = z.object({
  reason: z.string().optional(),
});
