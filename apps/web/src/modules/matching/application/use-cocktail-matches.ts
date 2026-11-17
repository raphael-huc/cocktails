import { useSuspenseQuery } from "@tanstack/react-query";
import {
  cocktailsQueryOptions,
  ingredientNames,
  ingredientsQueryOptions,
  withAncestors,
} from "@/modules/catalog";
import { pantryQueryOptions } from "@/modules/pantry";
import { matchCocktails } from "../domain/matching";

/** The catalog compared with the signed-in user's bar. */
export function useCocktailMatches() {
  const { data: cocktails } = useSuspenseQuery(cocktailsQueryOptions());
  const { data: ingredients } = useSuspenseQuery(ingredientsQueryOptions());
  const { data: pantry } = useSuspenseQuery(pantryQueryOptions());

  return {
    /** Every published cocktail with its status, closest matches first. */
    matches: matchCocktails(cocktails, ingredients, pantry),
    ingredientNames: ingredientNames(ingredients),
    /** The ingredients of the bar, plus the generic ones they cover. */
    availableIngredientIds: withAncestors(pantry, ingredients),
  };
}
