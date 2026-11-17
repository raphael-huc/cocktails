import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

/** Exported so links and other elements can take the appearance of a button. */
export const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2 rounded-control border font-body font-medium",
    "transition-colors cursor-pointer select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  variants: {
    variant: {
      primary: "border-accent bg-accent text-accent-ink hover:opacity-90",
      secondary: "border-line bg-transparent text-ink hover:bg-surface",
      ghost: "border-transparent bg-transparent text-ink-muted hover:text-ink",
    },
    size: {
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    },
    fullWidth: {
      true: "w-full",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonStyles>;

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
