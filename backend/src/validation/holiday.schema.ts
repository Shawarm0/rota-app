import { z } from "zod";

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().int().min(1).max(5).optional(),
  shiftId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const updateHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason: z.string().nullable().optional(),
});

export const rejectHolidaySchema = z.object({
  reason: z.string().optional(),
});
