import { z } from "zod";
import { fetchJsonCached } from "../cache.ts";
import type { IngredientResolver } from "../catalog/resolve.ts";
import { parseFreeTextLine } from "../normalize/free-text.ts";
import type { Category, Recipe, RecipeLine } from "../normalize/recipe.ts";
import { splitIntoSteps } from "../normalize/steps.ts";
import { capitalize, slugify } from "../normalize/text.ts";
import { findCocktailPhoto } from "./thecocktaildb-photos.ts";

/**
 * The official cocktails of the International Bartenders Association, from
 * the community dataset https://github.com/teijo/iba-cocktails.
 */
const URL = "https://raw.githubusercontent.com/teijo/iba-cocktails/master/recipes.json";

const measuredLine = z.object({
  unit: z.literal("cl"),
  amount: z.number(),
  /** Generic name: "Vermouth". */
  ingredient: z.string(),
  /** Precise variant, when the recipe asks for one: "Dry vermouth". */
  label: z.string().optional(),
});

const freeTextLine = z.object({ special: z.string() });

const ibaRecipe = z.object({
  name: z.string(),
  glass: z.string().optional(),
  ingredients: z.array(z.union([measuredLine, freeTextLine])),
  garnish: z.string().optional(),
  preparation: z.string().optional(),
});

export type IbaRecipe = z.output<typeof ibaRecipe>;

/** The dataset has no category of that kind, but the glass gives it away. */
const CATEGORY_BY_GLASS: Record<string, Category> = {
  shot: "shot",
  "hot-drink": "coffee-tea",
};

export async function loadIbaRecipes(
  resolver: IngredientResolver,
  { photos }: { photos: boolean },
): Promise<Recipe[]> {
  const sources = z.array(ibaRecipe).parse(await fetchJsonCached(URL, "iba/recipes.json"));
  const recipes = sources.map((source) => normalizeIbaRecipe(source, resolver));

  if (photos) {
    // The dataset has no pictures: borrow the one of the cocktail of the same name.
    for (const recipe of recipes) {
      recipe.photoUrl = await findCocktailPhoto(recipe.name);
    }
  }
  return recipes;
}

export function normalizeIbaRecipe(source: IbaRecipe, resolver: IngredientResolver): Recipe {
  const lines: RecipeLine[] = [];
  const issues: string[] = [];

  for (const line of source.ingredients) {
    if ("special" in line) {
      const parsed = parseFreeTextLine(line.special, resolver);
      if (parsed) lines.push(parsed);
      else issues.push(`Unknown ingredient in "${line.special}"`);
      continue;
    }

    // The label is the precise ask; the generic name is the fallback.
    const ingredient =
      (line.label ? resolver.exact(line.label) : undefined) ?? resolver.exact(line.ingredient);
    if (!ingredient) {
      issues.push(`Unknown ingredient "${line.label ?? line.ingredient}"`);
      continue;
    }
    lines.push({
      ingredientSlug: ingredient.slug,
      amount: line.amount * 10, // centilitres to millilitres
      unit: "ml",
      optional: false,
      garnish: false,
      note: null,
    });
  }

  const steps = splitIntoSteps(source.preparation ?? "");

  // The garnish is one sentence: "Orange slice and a cherry".
  const unknownGarnishes: string[] = [];
  for (const part of (source.garnish ?? "").split(/,|\band\b/)) {
    const text = part.trim();
    if (!text) continue;
    const parsed = parseFreeTextLine(text, resolver, { garnish: true });
    if (parsed) lines.push(parsed);
    else unknownGarnishes.push(text);
  }
  // A garnish we cannot identify is not worth blocking the recipe: say it in words.
  if (unknownGarnishes.length > 0) {
    steps.push(`Garnish: ${capitalize(unknownGarnishes.join(", "))}.`);
  }

  if (steps.length === 0) issues.push("No preparation steps");

  return {
    source: "iba",
    sourceId: slugify(source.name),
    name: source.name,
    category: CATEGORY_BY_GLASS[source.glass ?? ""] ?? "cocktail",
    glass: source.glass ?? null,
    photoUrl: null,
    lines,
    steps,
    issues,
  };
}
