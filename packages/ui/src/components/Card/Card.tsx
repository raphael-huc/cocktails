import type { ComponentProps } from "react";

export type CardProps = ComponentProps<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-line bg-surface p-5 ${className ?? ""}`}
      {...props}
    />
  );
}
