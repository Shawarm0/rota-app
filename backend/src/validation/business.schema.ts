import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(100),
  owner: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
  }),
});

// Without ids, every entry for the business is deleted
export const deleteActivitySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500).optional(),
});
