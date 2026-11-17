/**
 * Shape of the Directus collections used by this application.
 *
 * Hand-written mirror of the data model created by
 * `huc-back/scripts/setup-cocktails.py`: keep the two in sync. It only lists
 * what the application reads or writes.
 */

export type IngredientRow = {
  id: string;
  slug: string;
  category: string;
  parent: string | IngredientRow | null;
  translations: IngredientTranslationRow[];
};

export type IngredientTranslationRow = {
  id: number;
  ingredient_id: string | IngredientRow;
  languages_code: string;
  name: string;
};

export type CocktailRow = {
  id: string;
  name: string;
  status: "published" | "draft";
  category: string;
  source: string | null;
  glass: string | null;
  tint: string | null;
  image: string | null;
  translations: CocktailTranslationRow[];
  ingredients: CocktailIngredientRow[];
};

export type CocktailTranslationRow = {
  id: number;
  cocktail_id: string | CocktailRow;
  languages_code: string;
  description: string | null;
  steps: { text: string }[] | null;
};

export type CocktailIngredientRow = {
  id: string;
  cocktail: string | CocktailRow;
  ingredient: string | IngredientRow;
  amount: number | null;
  unit: string | null;
  optional: boolean;
  garnish: boolean;
  note: string | null;
  sort: number | null;
};

export type PantryItemRow = {
  id: string;
  ingredient: string | IngredientRow;
  user_created: string;
};

export type Schema = {
  ingredient: IngredientRow[];
  ingredient_translations: IngredientTranslationRow[];
  cocktail: CocktailRow[];
  cocktail_translations: CocktailTranslationRow[];
  cocktail_ingredient: CocktailIngredientRow[];
  pantry_item: PantryItemRow[];
};
