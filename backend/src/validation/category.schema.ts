import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  // Required when the owner creates one; store managers always use their own store
  locationId: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
