import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_EMAIL: z.string().default("mailto:admin@rota.app"),
  SWAP_APPROVAL_REQUIRED: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
