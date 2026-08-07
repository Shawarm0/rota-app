import type { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export function Card({ className, padding = true, children, ...props }: CardProps) {
  return (
    <div
      className={clsx("bg-white rounded-lg border border-gray-200", padding && "p-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}
