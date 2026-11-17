import type { ComponentProps } from "react";

export type ToggleChipProps = Omit<ComponentProps<"button">, "type" | "onChange"> & {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /**
   * Marks a chip that is off but whose option is already taken care of by
   * another one. It stays a normal, unpressed button; only its look changes.
   */
  outlined?: boolean;
};

/** A two-state button, for picking any number of options out of a set. */
export function ToggleChip({
  pressed,
  onPressedChange,
  outlined = false,
  className,
  ...props
}: ToggleChipProps) {
  let state = "border-line bg-transparent text-ink hover:bg-surface";
  if (pressed) state = "border-accent bg-accent text-accent-ink";
  else if (outlined)
    state = "border-dashed border-accent bg-transparent text-accent hover:bg-surface";

  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={[
        "inline-flex h-10 items-center rounded-control border px-3 text-sm transition-colors",
        "cursor-pointer select-none whitespace-nowrap",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        state,
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}
