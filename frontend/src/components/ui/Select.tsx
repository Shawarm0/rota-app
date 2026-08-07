import { type SelectHTMLAttributes, forwardRef } from "react";
import { useUiStore } from "../../stores/uiStore";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    const theme = useUiStore((s) => s.theme);
    const isCompact = theme === "compact";
    const isModern = theme === "modern";

    const accent = isCompact ? "focus:ring-violet-500 focus:border-violet-500" : isModern ? "focus:ring-indigo-400 focus:border-indigo-400" : "focus:ring-blue-500 focus:border-blue-500";
    const rounding = isCompact ? "rounded-md" : isModern ? "rounded-xl" : "rounded-lg";

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className={clsx(
            "block font-medium text-gray-700",
            isCompact ? "text-xs" : "text-sm",
          )}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={clsx(
            "block w-full border px-3 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2",
            rounding,
            accent,
            isCompact ? "text-[13px]" : "text-sm",
            error ? "border-red-300" : "border-gray-300",
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
