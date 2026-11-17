import type { ComponentProps } from "react";

export type SkeletonProps = ComponentProps<"div">;

/**
 * A grey block standing in for content that is still loading. Size it with
 * `className` to the shape of what it replaces, so the page does not jump when
 * the content arrives.
 *
 * It is hidden from assistive technologies: put one text alternative, such as
 * a visually hidden "Loading…" with `role="status"`, next to the group of
 * skeletons rather than on each block.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-control bg-line motion-safe:animate-pulse ${className ?? ""}`}
      {...props}
    />
  );
}
