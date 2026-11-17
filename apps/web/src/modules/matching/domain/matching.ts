import { type Cocktail, requiredIngredientIds } from "@/modules/catalog/domain/cocktail";
import { type Ingredient, withAncestors } from "@/modules/catalog/domain/ingredient";

export type MatchStatus = "makeable" | "almost" | "unavailable";

export type CocktailMatch = {
  cocktail: Cocktail;
  status: MatchStatus;
  /** Required ingredients the user does not have. */
  missingIngredientIds: string[];
};

export type MatchOptions = {
  /** How many missing ingredients still count as "almost". */
  maxMissing?: number;
};

/**
 * Compares every cocktail with what the user owns.
 *
 * Optional ingredients and garnishes never block a cocktail, and owning a
 * specific ingredient covers the generic ones above it in the hierarchy.
 * Results are ordered from the closest match to the furthest.
 */
export function matchCocktails(
  cocktails: readonly Cocktail[],
  ingredients: readonly Ingredient[],
  ownedIngredientIds: Iterable<string>,
  { maxMissing = 1 }: MatchOptions = {},
): CocktailMatch[] {
  const available = withAncestors(ownedIngredientIds, ingredients);

  return cocktails
    .map((cocktail): CocktailMatch => {
      const required = requiredIngredientIds(cocktail);
      const missingIngredientIds = required.filter((id) => !available.has(id));

      let status: MatchStatus = "unavailable";
      // A recipe without required ingredients is incomplete data, not a match.
      if (required.length > 0) {
        if (missingIngredientIds.length === 0) status = "makeable";
        else if (missingIngredientIds.length <= maxMissing) status = "almost";
      }

      return { cocktail, status, missingIngredientIds };
    })
    .toSorted(
      (a, b) =>
        a.missingIngredientIds.length - b.missingIngredientIds.length ||
        a.cocktail.name.localeCompare(b.cocktail.name),
    );
}

/** The cocktails a single missing ingredient would unlock. */
export type MissingIngredientGroup = {
  ingredientId: string;
  matches: CocktailMatch[];
};

/**
 * Turns "almost makeable" cocktails into a shopping list: for each ingredient
 * that is the only thing missing somewhere, the cocktails it would unlock.
 * The ingredient that unlocks the most comes first.
 *
 * Matches missing more than one ingredient are left out: no single purchase
 * makes them possible.
 */
export function groupByMissingIngredient(
  matches: readonly CocktailMatch[],
): MissingIngredientGroup[] {
  const groups = new Map<string, CocktailMatch[]>();

  for (const match of matches) {
    const [ingredientId, ...others] = match.missingIngredientIds;
    if (!ingredientId || others.length > 0) continue;
    const group = groups.get(ingredientId);
    if (group) group.push(match);
    else groups.set(ingredientId, [match]);
  }

  return [...groups]
    .map(([ingredientId, group]) => ({ ingredientId, matches: group }))
    .toSorted((a, b) => b.matches.length - a.matches.length);
}
