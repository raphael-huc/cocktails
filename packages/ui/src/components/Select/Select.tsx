import { type ComponentProps, useId } from "react";

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<ComponentProps<"select">, "id" | "value" | "onChange"> & {
  label: string;
  /** Keeps the label for assistive technologies only, when the context makes it obvious. */
  hideLabel?: boolean;
  options: readonly SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
};

/** A choice of one option out of a short list, using the platform's own picker. */
export function Select({
  label,
  hideLabel = false,
  options,
  value,
  onValueChange,
  className,
  ...props
}: SelectProps) {
  const id = useId();

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-sm font-medium text-ink-muted"}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={[
          "h-10 cursor-pointer rounded-control border border-line bg-surface px-2 text-sm text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
