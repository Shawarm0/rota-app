import { z } from "zod";

export const createSwapSchema = z.object({
  shiftId: z.string(),
});
