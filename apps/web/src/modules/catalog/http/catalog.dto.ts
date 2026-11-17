import { z } from "zod";
import { COCKTAIL_CATEGORIES, UNITS } from "../domain/cocktail";
import { INGREDIENT_CATEGORIES } from "../domain/ingredient";

export const ingredientDto = z.object({
  id: z.string(),
  // An unknown category must not make the whole catalog unreadable.
  category: z.enum(INGREDIENT_CATEGORIES).catch("other"),
  parent: z.string().nullable(),
  translations: z.array(
    z.object({
      languages_code: z.string(),
      name: z.string(),
    }),
  ),
});

export const cocktailDto = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(COCKTAIL_CATEGORIES).catch("other"),
  source: z.string().nullable(),
  glass: z.string().nullable(),
  tint: z.string().nullable(),
  image: z.string().nullable(),
  translations: z.array(
    z.object({
      languages_code: z.string(),
      description: z.string().nullable(),
      steps: z.array(z.object({ text: z.string() })).nullable(),
    }),
  ),
  ingredients: z.array(
    z.object({
      ingredient: z.string(),
      amount: z.number().nullable(),
      unit: z.enum(UNITS).nullable().catch(null),
      optional: z.boolean(),
      garnish: z.boolean(),
      note: z.string().nullable(),
      sort: z.number().nullable(),
    }),
  ),
});

export type IngredientDto = z.output<typeof ingredientDto>;
export type CocktailDto = z.output<typeof cocktailDto>;
