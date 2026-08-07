import type { HTMLAttributes } from "react";
import { useUiStore } from "../../stores/uiStore";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export function Card({ className, padding = true, children, ...props }: CardProps) {
  const theme = useUiStore((s) => s.theme);

  const base =
    theme === "compact" ? "bg-white rounded-lg border border-gray-200" :
    theme === "modern" ? "bg-white rounded-3xl shadow-md shadow-gray-200/50" :
    "bg-white rounded-2xl shadow-sm border border-gray-100";

  const pad =
    theme === "compact" ? "p-3" :
    theme === "modern" ? "p-6" :
    "p-5";

  return (
    <div className={clsx(base, padding && pad, className)} {...props}>
      {children}
    </div>
  );
}
