import type { ShiftStatus } from "../types";

export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  ASSIGNED: "bg-shift-assigned",
  ADDITIONAL: "bg-shift-additional",
  SWAP: "bg-shift-swap",
  HOLIDAY: "bg-shift-holiday",
  REQUESTED_HOLIDAY: "bg-shift-requested",
  AVAILABLE: "bg-shift-available",
  CANCELLED: "bg-shift-cancelled",
};

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  ASSIGNED: "Assigned",
  ADDITIONAL: "Additional",
  SWAP: "Swap",
  HOLIDAY: "Holiday",
  REQUESTED_HOLIDAY: "Requested Holiday",
  AVAILABLE: "Available",
  CANCELLED: "Cancelled",
};

export const API_URL = import.meta.env.VITE_API_URL || "";
