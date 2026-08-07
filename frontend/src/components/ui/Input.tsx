import { type InputHTMLAttributes, forwardRef } from "react";
import { useUiStore } from "../../stores/uiStore";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
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
      <input
        ref={ref}
        id={id}
        className={clsx(
          "block w-full border px-3 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2",
          rounding,
          accent,
          isCompact ? "text-[13px]" : "text-sm",
          error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
