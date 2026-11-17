import { z } from "zod";
import { fetchJsonCached } from "../cache.ts";
import type { IngredientResolver } from "../catalog/resolve.ts";
import { parseMeasure } from "../normalize/measure.ts";
import type { Category, Recipe, RecipeLine } from "../normalize/recipe.ts";
import { splitIntoSteps } from "../normalize/steps.ts";
import { capitalize, normalizeText, slugify } from "../normalize/text.ts";

/** TheCocktailDB. "1" is the public test key, good for development. */
const API = "https://www.thecocktaildb.com/api/json/v1/1";

/**
 * With the test key, a search by first letter returns 25 recipes at most and a
 * filter 100 at most. Both are used, then every recipe a filter revealed is
 * fetched on its own.
 */
const FIRST_CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
const FILTERS = [
  "c=Cocktail",
  "c=Ordinary_Drink",
  "c=Shot",
  "c=Punch_/_Party_Drink",
  "c=Coffee_/_Tea",
  "c=Beer",
  "c=Shake",
  "c=Soft_Drink",
  "c=Cocoa",
  "c=Other_/_Unknown",
  "a=Alcoholic",
  "a=Non_Alcoholic",
  "a=Optional_alcohol",
];

/** Recipes for making a liqueur over days or weeks: not drinks to mix. */
const SKIPPED_CATEGORY = "homemade liqueur";

const CATEGORIES: Record<string, Category> = {
  cocktail: "cocktail",
  "ordinary drink": "cocktail",
  shot: "shot",
  "punch / party drink": "punch",
  "coffee / tea": "coffee-tea",
  cocoa: "coffee-tea",
  beer: "beer",
  shake: "shake",
  "soft drink": "soft-drink",
};

/** Our glass names for the ones the source spells differently. */
const GLASSES: Record<string, string> = {
  "cocktail glass": "martini",
  "martini glass": "martini",
  "old fashioned glass": "old-fashioned",
  "whiskey glass": "old-fashioned",
  "highball glass": "highball",
  "collins glass": "collins",
  "margarita glass": "margarita",
  "margarita/coupette glass": "margarita",
  "champagne flute": "champagne-flute",
  "white wine glass": "white-wine",
  "wine glass": "white-wine",
  "hurricane glass": "hurricane",
  "shot glass": "shot",
  "irish coffee cup": "hot-drink",
  "coffee mug": "hot-drink",
};

const text = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null);

// The fifteen numbered columns are read by name, so the shape stays open.
const drink = z.looseObject({
  idDrink: z.string(),
  strDrink: z.string(),
  strCategory: text,
  strGlass: text,
  strInstructions: text,
  strDrinkThumb: text,
});

export type TheCocktailDbDrink = z.output<typeof drink>;

// "drinks" is null, or sometimes a message, when nothing matches.
const drinkList = z.object({ drinks: z.array(drink).nullable().catch(null) }).nullable();
const idList = z
  .object({
    drinks: z
      .array(z.object({ idDrink: z.string() }))
      .nullable()
      .catch(null),
  })
  .nullable();

export async function loadTheCocktailDbRecipes(
  resolver: IngredientResolver,
  { photos }: { photos: boolean },
): Promise<Recipe[]> {
  const drinks = new Map<string, TheCocktailDbDrink>();

  for (const character of FIRST_CHARACTERS) {
    const data = drinkList.parse(
      await fetchJsonCached(
        `${API}/search.php?f=${character}`,
        `thecocktaildb/letter-${character}.json`,
      ),
    );
    for (const found of data?.drinks ?? []) drinks.set(found.idDrink, found);
  }

  for (const filter of FILTERS) {
    const data = idList.parse(
      await fetchJsonCached(
        `${API}/filter.php?${filter}`,
        `thecocktaildb/filter-${slugify(filter)}.json`,
      ),
    );
    for (const { idDrink } of data?.drinks ?? []) {
      if (drinks.has(idDrink)) continue;
      const details = drinkList.parse(
        await fetchJsonCached(
          `${API}/lookup.php?i=${idDrink}`,
          `thecocktaildb/drink-${idDrink}.json`,
        ),
      );
      const found = details?.drinks?.[0];
      if (found) drinks.set(found.idDrink, found);
    }
  }

  return [...drinks.values()]
    .filter((found) => normalizeText(found.strCategory ?? "") !== SKIPPED_CATEGORY)
    .map((found) => {
      const recipe = normalizeTheCocktailDbDrink(found, resolver);
      return photos ? recipe : { ...recipe, photoUrl: null };
    });
}

export function normalizeTheCocktailDbDrink(
  source: TheCocktailDbDrink,
  resolver: IngredientResolver,
): Recipe {
  const lines: RecipeLine[] = [];
  const issues: string[] = [];

  for (let position = 1; position <= 15; position++) {
    const name = text.parse(source[`strIngredient${position}`]);
    if (!name) continue;
    const measure = text.parse(source[`strMeasure${position}`]) ?? "";

    const line = buildLine(name, measure, resolver);
    if (line) lines.push(line);
    else issues.push(`Unknown ingredient "${name}"`);
  }

  const steps = splitIntoSteps(source.strInstructions ?? "");
  if (steps.length === 0) issues.push("No preparation steps");
  if (lines.length === 0 && issues.length === 0) issues.push("No ingredients");

  const glass = normalizeText(source.strGlass ?? "");

  return {
    source: "thecocktaildb",
    sourceId: source.idDrink,
    name: source.strDrink.trim(),
    category: CATEGORIES[normalizeText(source.strCategory ?? "")] ?? "other",
    glass: glass ? (GLASSES[glass] ?? slugify(glass)) : null,
    photoUrl: source.strDrinkThumb,
    lines,
    steps,
    issues,
  };
}

/** "Juice of 1" next to a fruit is a measure of juice, not a piece of fruit. */
const JUICE_OF = /^juice of\b/i;
const JUICE_OF_FRUIT: Record<string, string> = {
  lemon: "lemon-juice",
  lime: "lime-juice",
  orange: "orange-juice",
};

/** Words that say the ingredient decorates the drink rather than goes into it. */
const GARNISH_WORDS = /\b(garnish|twists?|peels?|spirals?|wedges?|slices?|strips?|rim|rimmed)\b/i;
/** Ingredients that, without a volume, are dropped in or put on a pick. */
const GARNISH_BY_NATURE = new Set(["maraschino-cherry", "olive"]);
const OPTIONAL_WORDS = /\b(optional|if needed|if desired)\b/i;
/** Source names whose wording says more than the ingredient: "Lemon peel", "Powdered sugar". */
const DESCRIPTIVE_NAME =
  /\b(peel|spiral|cube|powdered|superfine|heavy|light|whipping|fresh|hot)\b/i;

/** One ingredient column of the source, or `null` when the ingredient is unknown. */
export function buildLine(
  name: string,
  rawMeasure: string,
  resolver: IngredientResolver,
): RecipeLine | null {
  const named = resolver.exact(name);
  if (!named) return null;

  // "(seltzer water)", "(if needed)": remarks, not part of the measure.
  const measure = rawMeasure
    .replace(/\([^)]*\)/g, " ")
    .replace(OPTIONAL_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim();

  const juiceSlug = JUICE_OF.test(measure) ? JUICE_OF_FRUIT[named.slug] : undefined;
  const ingredient = (juiceSlug ? resolver.bySlug(juiceSlug) : undefined) ?? named;
  const parsed = parseMeasure(measure);

  const garnish =
    !JUICE_OF.test(measure) &&
    (GARNISH_WORDS.test(measure) ||
      GARNISH_WORDS.test(name) ||
      (GARNISH_BY_NATURE.has(ingredient.slug) && !parsed));

  // How the ingredient reads inside a note.
  const shownName = DESCRIPTIVE_NAME.test(name) ? capitalize(name.toLowerCase()) : named.name;

  let note: string | null = null;
  if (ingredient.slug === "ice") {
    note = /crushed/i.test(measure) ? "Crushed ice" : null;
  } else if (parsed) {
    // "4 oz Chilled" + "Champagne": the measure converts, "Chilled Champagne" stays.
    note = parsed.qualifier ? capitalize(`${parsed.qualifier} ${shownName}`) : null;
  } else {
    // "Juice of 1" + "Lime": nothing converts, the wording stays. The garnish
    // badge already says "garnish": no need to repeat it in words.
    const wording = measure.replace(/^garnish(\s+with)?\b\s*/i, "");
    if (wording) note = capitalize(`${wording} ${shownName}`);
    else if (shownName !== named.name) note = shownName;
  }

  return {
    ingredientSlug: ingredient.slug,
    amount: parsed?.amount ?? null,
    unit: parsed?.unit ?? null,
    optional: OPTIONAL_WORDS.test(rawMeasure) || ingredient.alwaysAvailable === true,
    garnish,
    note,
  };
}
