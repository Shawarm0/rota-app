import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return <Loader2 className={clsx("animate-spin text-blue-600", spinnerSizes[size], className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
