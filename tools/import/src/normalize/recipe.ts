export type Unit = "ml" | "dash";

/** Kind of drink, used to browse the catalog. Mirrors the choices in Directus. */
export type Category =
  | "cocktail"
  | "shot"
  | "punch"
  | "coffee-tea"
  | "beer"
  | "shake"
  | "soft-drink"
  | "other";

/** One line of a recipe, ready for Directus. */
export type RecipeLine = {
  ingredientSlug: string;
  /** `null` when the source gives nothing that converts to a measure. */
  amount: number | null;
  unit: Unit | null;
  optional: boolean;
  garnish: boolean;
  /**
   * The source wording, kept when it says more than "amount + ingredient":
   * "6 mint sprigs", "Top with prosecco". Shown instead of the ingredient name.
   */
  note: string | null;
};

/** A recipe in the shape of our data model, whatever source it came from. */
export type Recipe = {
  source: string;
  /** Stable identifier of the recipe inside its source. */
  sourceId: string;
  name: string;
  category: Category;
  glass: string | null;
  /** Address of a photo to copy into Directus. */
  photoUrl: string | null;
  lines: RecipeLine[];
  steps: string[];
  /**
   * What could not be imported faithfully. A recipe with issues is created
   * as a draft, so it stays out of the application until someone fixes it.
   */
  issues: string[];
};
