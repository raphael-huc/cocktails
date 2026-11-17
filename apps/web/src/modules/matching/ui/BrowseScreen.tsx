import { Badge } from "@cocktails/ui";
import {
  type CocktailFilter,
  CocktailFilters,
  CocktailGrid,
  categoriesOf,
  cocktailCountLabel,
  matchesFilter,
} from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { useCocktailMatches } from "../application/use-cocktail-matches";

export type BrowseScreenProps = {
  filter: CocktailFilter;
  onFilterChange: (filter: CocktailFilter) => void;
};

/** Every published cocktail, with a mark on the ones the user's bar can make. */
export function BrowseScreen({ filter, onFilterChange }: BrowseScreenProps) {
  const { matches, ingredientNames } = useCocktailMatches();

  const visible = matches
    .filter((match) => matchesFilter(match.cocktail, filter))
    // Matches come closest first; a catalog reads better by name.
    .toSorted((a, b) => a.cocktail.name.localeCompare(b.cocktail.name));

  const listKey = `browse/${filter.category}/${filter.classicsOnly}/${filter.search}`;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <h1 className="font-display text-5xl">{m.catalog_title()}</h1>
        <CocktailFilters
          filter={filter}
          onChange={onFilterChange}
          categories={categoriesOf(matches.map((match) => match.cocktail))}
          search
        />
      </header>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {visible.length === 0 ? m.catalog_empty() : cocktailCountLabel(visible.length)}
      </p>

      <CocktailGrid
        key={listKey}
        listKey={listKey}
        ingredientNames={ingredientNames}
        items={visible.map((match) => ({
          cocktail: match.cocktail,
          badge:
            match.status === "makeable" ? <Badge tone="accent">{m.catalog_ready()}</Badge> : null,
        }))}
      />
    </div>
  );
}
