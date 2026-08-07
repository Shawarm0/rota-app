import type { ShiftStatus } from "../types";

export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  ADDITIONAL: "bg-emerald-100 text-emerald-700",
  AVAILABLE: "bg-gray-100 text-gray-600",
};

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  ASSIGNED: "Assigned",
  ADDITIONAL: "Additional",
  AVAILABLE: "Available",
};

export const API_URL = import.meta.env.VITE_API_URL || "";
