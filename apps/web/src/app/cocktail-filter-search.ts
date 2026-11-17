import { z } from "zod";
import { COCKTAIL_CATEGORIES, type CocktailFilter } from "@/modules/catalog";

/**
 * The filter of the pages that list cocktails, kept in the address:
 * `?category=shot&classics=true&q=sour`. It then survives a reload, the back
 * button, and can be shared. An unknown value is ignored, not an error.
 */
export const cocktailFilterSearchSchema = z.object({
  category: z.enum(COCKTAIL_CATEGORIES).optional().catch(undefined),
  classics: z.boolean().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export type CocktailFilterSearch = z.output<typeof cocktailFilterSearchSchema>;

export function toCocktailFilter(search: CocktailFilterSearch): CocktailFilter {
  return {
    category: search.category ?? null,
    classicsOnly: search.classics ?? false,
    search: search.q ?? "",
  };
}

/** Defaults are left out, so an unfiltered page keeps a clean address. */
export function toCocktailFilterSearch(filter: CocktailFilter): CocktailFilterSearch {
  return {
    category: filter.category ?? undefined,
    classics: filter.classicsOnly || undefined,
    q: filter.search || undefined,
  };
}
