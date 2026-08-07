import clsx from "clsx";
import type { ShiftStatus } from "../../types";
import { SHIFT_STATUS_COLORS, SHIFT_STATUS_LABELS } from "../../lib/constants";
import { useUiStore } from "../../stores/uiStore";

interface BadgeProps {
  status: ShiftStatus;
  className?: string;
}

export function ShiftBadge({ status, className }: BadgeProps) {
  const theme = useUiStore((s) => s.theme);
  const rounding = theme === "compact" ? "rounded-md" : "rounded-full";
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-white",
        rounding,
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
  const theme = useUiStore((s) => s.theme);
  const rounding = theme === "compact" ? "rounded-md" : "rounded-full";
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
        rounding,
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
