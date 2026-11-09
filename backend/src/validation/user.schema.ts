import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(["OWNER", "MANAGER", "EMPLOYEE"]),
  businessId: z.string().optional(),
  locationId: z.string().optional(),
  categoryId: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  locationId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  isAssistantManager: z.boolean().optional(),
  role: z.enum(["MANAGER", "EMPLOYEE"]).optional(),
  // Other stores the owner lets a store manager see, and whether they can edit them
  storeAccess: z.array(z.object({ locationId: z.string(), canEdit: z.boolean() })).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});
