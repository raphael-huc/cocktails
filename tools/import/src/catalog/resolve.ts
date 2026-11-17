import { normalizeText } from "../normalize/text.ts";
import { type CatalogIngredient, INGREDIENTS } from "./ingredients.ts";

export type IngredientResolver = {
  /** The ingredient whose name or alias is exactly this text. */
  exact(text: string): CatalogIngredient | undefined;
  /**
   * The ingredient mentioned in a free-text line such as "6 Mint sprigs" or
   * "Top with Prosecco". When several names fit, the longest one wins, so
   * that "1 dash Lime juice" is lime juice and not lime.
   */
  mentionedIn(text: string): CatalogIngredient | undefined;
  bySlug(slug: string): CatalogIngredient | undefined;
};

export function createIngredientResolver(
  ingredients: readonly CatalogIngredient[] = INGREDIENTS,
): IngredientResolver {
  const bySlug = new Map<string, CatalogIngredient>();
  const byKey = new Map<string, CatalogIngredient>();

  for (const ingredient of ingredients) {
    if (bySlug.has(ingredient.slug)) {
      throw new Error(`Duplicate ingredient slug: ${ingredient.slug}`);
    }
    bySlug.set(ingredient.slug, ingredient);

    for (const name of [ingredient.name, ...(ingredient.aliases ?? [])]) {
      const key = normalizeText(name);
      const other = byKey.get(key);
      if (other && other !== ingredient) {
        throw new Error(`"${name}" names both ${other.slug} and ${ingredient.slug}`);
      }
      byKey.set(key, ingredient);
    }
  }

  for (const ingredient of ingredients) {
    if (ingredient.parent && !bySlug.has(ingredient.parent)) {
      throw new Error(`Unknown parent "${ingredient.parent}" for ${ingredient.slug}`);
    }
    for (const replaced of ingredient.replaces ?? []) {
      if (bySlug.has(replaced)) {
        throw new Error(`"${replaced}" is replaced by ${ingredient.slug} but still listed`);
      }
    }
  }

  // Longest first, so the most specific name is found before a shorter one.
  const keysByLength = [...byKey.keys()].sort((a, b) => b.length - a.length);

  return {
    bySlug: (slug) => bySlug.get(slug),
    exact: (text) => byKey.get(normalizeText(text)),
    mentionedIn: (text) => {
      // Padding makes the search match whole words only. A trailing "s" is
      // tolerated so that "mint sprigs" or "chili peppers" need no alias.
      const haystack = ` ${normalizeText(text)} `;
      const key = keysByLength.find(
        (candidate) => haystack.includes(` ${candidate} `) || haystack.includes(` ${candidate}s `),
      );
      return key ? byKey.get(key) : undefined;
    },
  };
}
