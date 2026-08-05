import clsx from "clsx";
import type { ShiftStatus } from "../../types";
import { SHIFT_STATUS_COLORS, SHIFT_STATUS_LABELS } from "../../lib/constants";

interface BadgeProps {
  status: ShiftStatus;
  className?: string;
}

export function ShiftBadge({ status, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
        SHIFT_STATUS_COLORS[status],
        className,
      )}
    >
      {SHIFT_STATUS_LABELS[status]}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "red" | "yellow" | "gray" | "purple";
  className?: string;
}

const badgeVariants = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  gray: "bg-gray-100 text-gray-800",
  purple: "bg-purple-100 text-purple-800",
};

export function Badge({ children, variant = "gray", className }: GenericBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
