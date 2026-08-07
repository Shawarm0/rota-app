import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";

const classicVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
};

const compactVariants = {
  primary: "bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
};

const modernVariants = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-400 shadow-sm shadow-indigo-500/25",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
  danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
  ghost: "text-gray-500 hover:bg-gray-100 focus:ring-gray-400",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const theme = useUiStore((s) => s.theme);

    const variantMap = theme === "compact" ? compactVariants : theme === "modern" ? modernVariants : classicVariants;
    const rounding = theme === "compact" ? "rounded-md" : theme === "modern" ? "rounded-xl" : "rounded-lg";

    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          rounding,
          variantMap[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
