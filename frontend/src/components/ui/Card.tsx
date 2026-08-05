import type { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export function Card({ className, padding = true, children, ...props }: CardProps) {
  return (
    <div
      className={clsx("bg-white rounded-2xl shadow-sm border border-gray-100", padding && "p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}
