import { m } from "@/shared/i18n";
import type { CocktailCategory } from "../domain/cocktail";

const CATEGORY_LABELS: Record<CocktailCategory, () => string> = {
  cocktail: m.cocktail_category_cocktail,
  shot: m.cocktail_category_shot,
  punch: m.cocktail_category_punch,
  "coffee-tea": m.cocktail_category_coffee_tea,
  beer: m.cocktail_category_beer,
  shake: m.cocktail_category_shake,
  "soft-drink": m.cocktail_category_soft_drink,
  other: m.cocktail_category_other,
};

export function categoryLabel(category: CocktailCategory): string {
  return CATEGORY_LABELS[category]();
}

/** "1 cocktail", "12 cocktails". */
export function cocktailCountLabel(count: number): string {
  return count === 1 ? m.cocktail_count_one() : m.cocktail_count_other({ count });
}

/**
 * Glasses are stored as identifiers ("old-fashioned", "champagne-flute") and
 * there are too many kinds to translate one by one: the identifier is turned
 * into words.
 */
export function glassLabel(glass: string): string {
  const words = glass.replace(/-/g, " ").replace(/\s*glass$/, "");
  return m.cocktail_glass({ glass: words.charAt(0).toUpperCase() + words.slice(1) });
}
