import { useState } from "react";

/**
 * How far each list was unfolded, kept for the whole visit: coming back from
 * a cocktail's page finds the list as long as it was left, so the browser can
 * restore the scroll position.
 */
const unfolded = new Map<string, number>();

/**
 * Shows a long list one page at a time, with a "show more" action.
 *
 * `listKey` identifies the list and what it is filtered by. Give the component
 * using the hook the same value as its React `key`, so that a different filter
 * starts again from the first page.
 */
export function useShowMore(listKey: string, total: number, pageSize = 30) {
  const [shown, setShown] = useState(() => unfolded.get(listKey) ?? pageSize);
  const visible = Math.min(shown, total);

  return {
    visible,
    remaining: total - visible,
    /** Number of items the next "show more" reveals. */
    nextPage: Math.min(pageSize, total - visible),
    showMore: () => {
      const next = visible + pageSize;
      unfolded.set(listKey, next);
      setShown(next);
    },
  };
}
