import type { ComponentType } from "react";
import { useUiStore } from "../../stores/uiStore";
import clsx from "clsx";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const theme = useUiStore((s) => s.theme);
  const isModern = theme === "modern";

  return (
    <div className={clsx("flex flex-col items-center justify-center text-center", isModern ? "py-16" : "py-12")}>
      <Icon className={clsx("mb-4", isModern ? "h-14 w-14 text-gray-200" : "h-12 w-12 text-gray-300")} />
      <h3 className={clsx("font-medium text-gray-900", isModern ? "text-xl" : "text-lg")}>{title}</h3>
      {description && <p className={clsx("mt-1 text-gray-500 max-w-sm", isModern ? "text-base" : "text-sm")}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
