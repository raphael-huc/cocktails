import { Skeleton } from "@cocktails/ui";
import { m } from "@/shared/i18n";

/** The one text alternative of a group of skeletons. */
function LoadingStatus() {
  return (
    <p role="status" className="sr-only">
      {m.loading()}
    </p>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-card border border-l-4 border-line bg-surface p-5">
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="size-18 shrink-0 rounded-card" />
    </div>
  );
}

export type CocktailListSkeletonProps = {
  /** Whether the page it stands for starts with a title and a search field. */
  withHeading?: boolean;
  cards?: number;
};

/** Stands in for a page listing cocktails while its data loads. */
export function CocktailListSkeleton({
  withHeading = false,
  cards = 9,
}: CocktailListSkeletonProps) {
  return (
    <div className="flex flex-col gap-8">
      <LoadingStatus />
      {withHeading ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-11 w-full max-w-sm" />
        </div>
      ) : null}
      <div className="flex gap-2 overflow-hidden">
        {[28, 14, 24, 16, 20, 36].map((width) => (
          <Skeleton key={width} className="h-10 shrink-0" style={{ width: `${width * 4}px` }} />
        ))}
      </div>
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          // Identical placeholders: their position is all there is to them.
          // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/** Stands in for a cocktail's page while its data loads. */
export function CocktailDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <LoadingStatus />
      <Skeleton className="h-4 w-28" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Skeleton className="aspect-square w-full rounded-card sm:w-56" />
        <div className="flex flex-1 flex-col gap-4 border-l-4 border-line pl-5">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-36" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {[40, 56, 48, 36].map((width) => (
            <div key={width} className="flex gap-3 py-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6" style={{ width: `${width * 4}px` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
