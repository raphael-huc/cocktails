import {
  type CocktailFilter,
  CocktailFilters,
  categoriesOf,
  matchesFilter,
} from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { useCocktailMatches } from "../application/use-cocktail-matches";
import { groupByMissingIngredient } from "../domain/matching";
import { MatchList } from "./MatchList";

export type MatchesScreenProps = {
  filter: CocktailFilter;
  onFilterChange: (filter: CocktailFilter) => void;
};

/** What the user can make now, and what a single purchase would add. */
export function MatchesScreen({ filter, onFilterChange }: MatchesScreenProps) {
  const { matches, ingredientNames } = useCocktailMatches();

  const reachable = matches.filter((match) => match.status !== "unavailable");
  const visible = reachable.filter((match) => matchesFilter(match.cocktail, filter));
  const makeable = visible.filter((match) => match.status === "makeable");
  const almostGroups = groupByMissingIngredient(visible);

  // Only offer the categories the user's bar actually reaches.
  const categories = categoriesOf(reachable.map((match) => match.cocktail));
  const filteredToNothing = reachable.length > 0 && visible.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {reachable.length > 0 ? (
        <CocktailFilters filter={filter} onChange={onFilterChange} categories={categories} />
      ) : null}
      {filteredToNothing ? (
        <p className="text-ink-muted">{m.matches_none_in_category()}</p>
      ) : (
        <MatchList
          listKey={`matches/${filter.category}/${filter.classicsOnly}`}
          makeable={makeable}
          almostGroups={almostGroups}
          ingredientNames={ingredientNames}
        />
      )}
    </div>
  );
}
