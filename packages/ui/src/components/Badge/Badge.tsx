import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badgeStyles = tv({
  base: "inline-flex items-center rounded-control border px-2 py-0.5 text-xs font-medium",
  variants: {
    tone: {
      neutral: "border-line text-ink-muted",
      accent: "border-accent text-accent",
      danger: "border-danger text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeStyles>;

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={badgeStyles({ tone, className })} {...props} />;
}
