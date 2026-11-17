export const INGREDIENT_CATEGORIES = [
  "spirit",
  "liqueur",
  "fortified_wine",
  "bitters",
  "juice",
  "syrup",
  "mixer",
  "fresh",
  "other",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export type Ingredient = {
  id: string;
  name: string;
  category: IngredientCategory;
  /** A more generic ingredient this one can stand in for (bourbon → whiskey). */
  parentId: string | null;
};

export function ingredientNames(ingredients: readonly Ingredient[]): Map<string, string> {
  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name]));
}

/**
 * The given ingredients plus every ancestor of each one.
 *
 * Owning a specific ingredient means owning the generic ones above it: a
 * bottle of bourbon satisfies a recipe that asks for whiskey, not the reverse.
 */
export function withAncestors(
  ingredientIds: Iterable<string>,
  ingredients: readonly Ingredient[],
): Set<string> {
  const parentOf = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.parentId]));
  const result = new Set<string>();

  for (const id of ingredientIds) {
    let current: string | null | undefined = id;
    // The `has` check also stops on a cycle in the data.
    while (current && !result.has(current)) {
      result.add(current);
      current = parentOf.get(current);
    }
  }

  return result;
}
