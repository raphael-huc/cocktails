export const UNITS = ["ml", "dash"] as const;

export type Unit = (typeof UNITS)[number];

/** Kinds of drink, in the order they are offered to the user. */
export const COCKTAIL_CATEGORIES = [
  "cocktail",
  "shot",
  "punch",
  "coffee-tea",
  "beer",
  "shake",
  "soft-drink",
  "other",
] as const;

export type CocktailCategory = (typeof COCKTAIL_CATEGORIES)[number];

export type CocktailIngredient = {
  ingredientId: string;
  /** `null` when the recipe gives no measure (a garnish, "top up with soda"). */
  amount: number | null;
  unit: Unit | null;
  optional: boolean;
  garnish: boolean;
  /**
   * Wording to show instead of the ingredient name when the line is more than
   * a measure: "6 mint sprigs", "Top with prosecco".
   */
  note: string | null;
};

export type Cocktail = {
  id: string;
  name: string;
  category: CocktailCategory;
  /** An established recipe (official IBA list), as opposed to a community one. */
  classic: boolean;
  description: string | null;
  /** Identifier of the glass to serve it in, such as "old-fashioned". */
  glass: string | null;
  /** CSS colour of the drink, used as the accent of its card and page. */
  tint: string | null;
  imageUrl: string | null;
  /** Small square version of the image, for lists. */
  thumbnailUrl: string | null;
  ingredients: CocktailIngredient[];
  steps: string[];
};

/** Ingredients without which the cocktail cannot be made. */
export function requiredIngredientIds(cocktail: Cocktail): string[] {
  return cocktail.ingredients
    .filter((ingredient) => !ingredient.optional && !ingredient.garnish)
    .map((ingredient) => ingredient.ingredientId);
}

/** The first required ingredients, enough to recognise the drink at a glance. */
export function mainIngredientIds(cocktail: Cocktail, limit = 4): string[] {
  return [...new Set(requiredIngredientIds(cocktail))].slice(0, limit);
}

/** How many cocktails cannot be made without each ingredient. */
export function ingredientUsage(cocktails: readonly Cocktail[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const cocktail of cocktails) {
    for (const id of new Set(requiredIngredientIds(cocktail))) {
      usage.set(id, (usage.get(id) ?? 0) + 1);
    }
  }
  return usage;
}

/** The categories that have at least one of these cocktails, in display order. */
export function categoriesOf(cocktails: readonly Cocktail[]): CocktailCategory[] {
  const present = new Set(cocktails.map((cocktail) => cocktail.category));
  return COCKTAIL_CATEGORIES.filter((category) => present.has(category));
}

/** What the user asked to see in a list of cocktails. */
export type CocktailFilter = {
  /** `null` shows every category. */
  category: CocktailCategory | null;
  classicsOnly: boolean;
  /** Text looked for in the name; empty matches everything. */
  search: string;
};

export const NO_FILTER: CocktailFilter = { category: null, classicsOnly: false, search: "" };

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** The search ignores case and accents: "pina" finds "Piña Colada". */
export function matchesFilter(cocktail: Cocktail, filter: CocktailFilter): boolean {
  if (filter.category !== null && cocktail.category !== filter.category) return false;
  if (filter.classicsOnly && !cocktail.classic) return false;
  return fold(cocktail.name).includes(fold(filter.search.trim()));
}
