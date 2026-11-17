import { Button } from "@cocktails/ui";
import type { ReactNode } from "react";
import { m } from "@/shared/i18n";
import { useShowMore } from "@/shared/ui/use-show-more";
import type { Cocktail } from "../domain/cocktail";
import { CocktailCard } from "./CocktailCard";

export type CocktailGridItem = {
  cocktail: Cocktail;
  footer?: ReactNode;
  badge?: ReactNode;
};

export type CocktailGridProps = {
  /**
   * Identifies the list and its filter. Use the same value as the React `key`
   * of the grid, so a new filter starts from the first page.
   */
  listKey: string;
  items: readonly CocktailGridItem[];
  ingredientNames?: ReadonlyMap<string, string>;
};

/** A grid of cocktail cards that unfolds a page at a time. */
export function CocktailGrid({ listKey, items, ingredientNames }: CocktailGridProps) {
  const { visible, remaining, nextPage, showMore } = useShowMore(listKey, items.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, visible).map((item) => (
          <CocktailCard
            key={item.cocktail.id}
            cocktail={item.cocktail}
            ingredientNames={ingredientNames}
            footer={item.footer}
            badge={item.badge}
          />
        ))}
      </div>
      {remaining > 0 ? (
        <Button variant="secondary" className="self-center" onClick={showMore}>
          {m.list_show_more({ count: nextPage })}
        </Button>
      ) : null}
    </div>
  );
}
