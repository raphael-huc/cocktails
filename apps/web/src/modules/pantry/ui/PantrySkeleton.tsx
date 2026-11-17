import { Skeleton } from "@cocktails/ui";
import { m } from "@/shared/i18n";

/** Widths, in pixels, of the placeholder chips: irregular like real ingredient names. */
const CHIP_WIDTHS = [72, 96, 120, 64, 108, 88, 140, 76, 100, 84, 116, 68];

/** Stands in for the user's bar while its data loads. */
export function PantrySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <p role="status" className="sr-only">
        {m.loading()}
      </p>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-11 w-full max-w-sm" />
      {["first", "second", "third"].map((group) => (
        <div key={group} className="flex flex-col gap-3">
          <Skeleton className="h-8 w-40" />
          <div className="flex flex-wrap gap-2">
            {CHIP_WIDTHS.map((width) => (
              <Skeleton key={width} className="h-10" style={{ width: `${width}px` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
