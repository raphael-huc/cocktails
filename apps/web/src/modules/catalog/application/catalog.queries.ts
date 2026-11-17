import { queryOptions } from "@tanstack/react-query";
import { getContentLanguage } from "@/shared/i18n";
import { fetchCocktails, fetchIngredients } from "../http/catalog.repository";

// The catalog only changes when recipes are imported or edited in Directus.
const CATALOG_STALE_TIME = 30 * 60 * 1000;

export function ingredientsQueryOptions() {
  const language = getContentLanguage();
  return queryOptions({
    queryKey: ["catalog", "ingredients", language] as const,
    queryFn: () => fetchIngredients(language),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function cocktailsQueryOptions() {
  const language = getContentLanguage();
  return queryOptions({
    queryKey: ["catalog", "cocktails", language] as const,
    queryFn: () => fetchCocktails(language),
    staleTime: CATALOG_STALE_TIME,
  });
}
