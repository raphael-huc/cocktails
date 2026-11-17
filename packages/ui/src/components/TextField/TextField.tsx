import { type ComponentProps, useId } from "react";

export type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  /** Shown under the input and announced to assistive technologies. */
  error?: string | null;
};

export function TextField({ label, error, className, ...props }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          "h-11 rounded-control border bg-surface px-3 text-base text-ink",
          "placeholder:text-ink-muted",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
          error ? "border-danger" : "border-line",
        ].join(" ")}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
