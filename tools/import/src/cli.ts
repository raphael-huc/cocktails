import { writeCacheFile } from "./cache.ts";
import { INGREDIENTS } from "./catalog/ingredients.ts";
import { createIngredientResolver, type IngredientResolver } from "./catalog/resolve.ts";
import { createDirectusClient } from "./directus/client.ts";
import { pushRecipes } from "./directus/push.ts";
import { syncIngredients } from "./directus/sync-ingredients.ts";
import { warmCocktailPhotos } from "./directus/warm.ts";
import type { Recipe } from "./normalize/recipe.ts";
import { loadIbaRecipes } from "./sources/iba.ts";
import { loadTheCocktailDbRecipes } from "./sources/thecocktaildb.ts";

const USAGE = `Usage: pnpm import-recipes <source> [--push] [--refresh] [--no-photos]
       pnpm import-recipes sync-ingredients
       pnpm import-recipes warm-photos

Sources:
  iba            the official IBA cocktails
  thecocktaildb  everything the public key of TheCocktailDB gives access to

Without --push nothing is written to Directus: the recipes are fetched,
normalized, and a report is printed (dry run).

  --push       create the ingredients and cocktails in Directus
  --refresh    with --push, also rewrite the recipe (lines, steps, category,
               glass) of the cocktails already imported from that source;
               corrections made by hand to those fields are overwritten
  --no-photos  do not import cocktail photos

sync-ingredients brings the ingredients of Directus in line with the catalog
(src/catalog/ingredients.ts): names in every language, categories, hierarchy,
and merges of ingredients the catalog declares as replaced.

warm-photos makes Directus generate every size of every cocktail photo, so
the application shows them at once. An import with --push does it too.
`;

type SourceLoader = (
  resolver: IngredientResolver,
  options: { photos: boolean },
) => Promise<Recipe[]>;

const SOURCES: Record<string, SourceLoader> = {
  iba: loadIbaRecipes,
  thecocktaildb: loadTheCocktailDbRecipes,
};

const UNKNOWN_INGREDIENT = /^Unknown ingredient(?: in)? "(.+)"$/;

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const sourceName = args.find((arg) => !arg.startsWith("--"));
  const loadSource = sourceName ? SOURCES[sourceName] : undefined;

  if (sourceName === "sync-ingredients") {
    const result = await syncIngredients(
      await createDirectusClient(),
      INGREDIENTS,
      createIngredientResolver(),
    );
    console.log(`Merged: ${result.merged.length}`);
    for (const merge of result.merged) console.log(`  ${merge}`);
    console.log(`Created (parents that were missing): ${result.created.length}`);
    console.log(`Category or parent corrected: ${result.reorganised.length}`);
    if (result.reorganised.length > 0) console.log(`  ${result.reorganised.join(", ")}`);
    console.log(`Names added or corrected: ${result.renamed.length}`);
    if (result.unknown.length > 0) {
      console.log(`Not in the catalog, left alone: ${result.unknown.join(", ")}`);
    }
    return 0;
  }

  if (sourceName === "warm-photos") {
    const count = await warmCocktailPhotos(await createDirectusClient());
    console.log(`Photos ready: ${count} images requested`);
    return 0;
  }

  if (!sourceName || !loadSource) {
    console.log(USAGE);
    return sourceName ? 1 : 0;
  }

  const resolver = createIngredientResolver();
  const recipes = await loadSource(resolver, { photos: !flags.has("--no-photos") });

  const withIssues = recipes.filter((recipe) => recipe.issues.length > 0);
  const ingredients = new Set(recipes.flatMap((r) => r.lines.map((l) => l.ingredientSlug)));

  // How many recipes each unknown name is holding back: the most wanted first.
  const unknown = new Map<string, number>();
  const otherIssues: string[] = [];
  for (const recipe of withIssues) {
    for (const issue of recipe.issues) {
      const name = UNKNOWN_INGREDIENT.exec(issue)?.[1];
      if (name) unknown.set(name, (unknown.get(name) ?? 0) + 1);
      else otherIssues.push(`${recipe.name}: ${issue}`);
    }
  }
  const unknownByDemand = [...unknown.entries()].sort((a, b) => b[1] - a[1]);

  const report = await writeCacheFile(`report-${sourceName}.json`, {
    unknownIngredients: Object.fromEntries(unknownByDemand),
    recipes,
  });

  const categories = new Map<string, number>();
  for (const recipe of recipes) {
    categories.set(recipe.category, (categories.get(recipe.category) ?? 0) + 1);
  }

  console.log(`${recipes.length} recipes, ${ingredients.size} distinct ingredients`);
  console.log(`By category: ${[...categories].map(([name, n]) => `${name} ${n}`).join(", ")}`);
  console.log(`${recipes.filter((recipe) => recipe.photoUrl).length} with a photo`);
  console.log(
    `${recipes.length - withIssues.length} clean (published), ${withIssues.length} with issues (drafts)`,
  );
  if (unknownByDemand.length > 0) {
    const shown = unknownByDemand.slice(0, 15).map(([name, n]) => `${name} (${n})`);
    console.log(`  ${unknownByDemand.length} unknown ingredients, most used: ${shown.join(", ")}`);
  }
  for (const issue of otherIssues.slice(0, 15)) console.log(`  ${issue}`);
  if (otherIssues.length > 15) console.log(`  … and ${otherIssues.length - 15} more`);
  console.log(`Full report: ${report}`);

  if (!flags.has("--push")) {
    console.log("\nDry run: nothing was written. Add --push to import.");
    return 0;
  }

  const client = await createDirectusClient();
  const result = await pushRecipes(client, recipes, resolver, {
    refresh: flags.has("--refresh"),
  });
  console.log(`\nIngredients created: ${result.ingredientsCreated.length}`);
  console.log(`Cocktails created: ${result.cocktailsCreated.length}`);
  console.log(`Cocktails already present, left untouched: ${result.cocktailsKept.length}`);
  if (flags.has("--refresh")) {
    console.log(`Cocktails refreshed from the source: ${result.cocktailsRefreshed.length}`);
  }
  console.log(`Photos added: ${result.photosAdded.length}`);
  if (result.photosAdded.length > 0) {
    console.log(`Photos ready: ${await warmCocktailPhotos(client)} images requested`);
  }
  if (result.failures.length > 0) {
    console.log(`Refused by Directus: ${result.failures.length}`);
    for (const failure of result.failures) console.log(`  ${failure}`);
    return 1;
  }
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
