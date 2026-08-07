import type { ShiftStatus } from "../types";

export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-shift-assigned",
  ADDITIONAL: "bg-shift-additional",
  AVAILABLE: "bg-shift-available",
};

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  ASSIGNED: "Assigned",
  ADDITIONAL: "Additional",
  AVAILABLE: "Available",
};

export const API_URL = import.meta.env.VITE_API_URL || "";
