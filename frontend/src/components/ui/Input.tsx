import { type InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "block w-full rounded-md border px-3 py-2 text-[13px] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500",
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
