import type { IngredientResolver } from "../catalog/resolve.ts";
import type { Recipe } from "../normalize/recipe.ts";
import { normalizeText } from "../normalize/text.ts";
import type { DirectusClient } from "./client.ts";
import { ingredientNames } from "./sync-ingredients.ts";

const LANGUAGE = "en-US";
const PICTURE_FOLDER = "Cocktail Picture";

export type PushResult = {
  ingredientsCreated: string[];
  cocktailsCreated: string[];
  /** Already in Directus: left exactly as they are. */
  cocktailsKept: string[];
  /** Already in Directus: recipe rewritten from the source (`refresh` only). */
  cocktailsRefreshed: string[];
  photosAdded: string[];
  /** Recipes Directus refused, with the reason. The others are unaffected. */
  failures: string[];
};

type IngredientRow = { id: string; slug: string; parent: string | null };
type CocktailRow = {
  id: string;
  name: string;
  source: string | null;
  source_id: string | null;
  image: string | null;
};

/**
 * Writes the recipes to Directus. Safe to run again:
 *  - an ingredient that exists is reused, never modified, except that a
 *    missing parent is filled in;
 *  - a cocktail that exists (same source and id, or same name) is never
 *    modified, so manual corrections survive. Only a missing photo is added.
 *
 * With `refresh`, a cocktail that came from the same source gets its recipe
 * (lines, steps, category, glass) rewritten from what the source says now.
 * That is how improvements to the normalisation reach recipes already
 * imported; it overwrites corrections made by hand to those fields. Name,
 * status, description, tint and photo are never touched.
 */
export async function pushRecipes(
  client: DirectusClient,
  recipes: readonly Recipe[],
  resolver: IngredientResolver,
  { refresh = false }: { refresh?: boolean } = {},
): Promise<PushResult> {
  const result: PushResult = {
    ingredientsCreated: [],
    cocktailsCreated: [],
    cocktailsKept: [],
    cocktailsRefreshed: [],
    photosAdded: [],
    failures: [],
  };

  const ingredientIds = await syncIngredients(client, recipes, resolver, result);
  const folderId = await findPictureFolder(client);

  const existing = await client.get<CocktailRow[]>("/items/cocktail", {
    fields: "id,name,source,source_id,image",
    limit: -1,
  });

  async function importPhoto(recipe: Recipe): Promise<string | null> {
    if (!recipe.photoUrl) return null;
    const file = await client.post<{ id: string }>("/files/import", {
      url: recipe.photoUrl,
      data: { folder: folderId, title: recipe.name },
    });
    result.photosAdded.push(recipe.name);
    return file.id;
  }

  for (const recipe of recipes) {
    const found =
      existing.find((row) => row.source === recipe.source && row.source_id === recipe.sourceId) ??
      existing.find((row) => normalizeText(row.name) === normalizeText(recipe.name));

    // One refused recipe must not stop the hundreds that follow it.
    try {
      if (found) {
        const sameOrigin = found.source === recipe.source && found.source_id === recipe.sourceId;
        if (refresh && sameOrigin) {
          await refreshCocktail(client, found.id, recipe, ingredientIds);
          result.cocktailsRefreshed.push(recipe.name);
        } else {
          result.cocktailsKept.push(recipe.name);
        }
        if (!found.image) {
          const image = await importPhoto(recipe);
          if (image) await client.patch(`/items/cocktail/${found.id}`, { image });
        }
        continue;
      }

      const created = await client.post<{ id: string }>("/items/cocktail", {
        name: recipe.name,
        status: recipe.issues.length === 0 ? "published" : "draft",
        source: recipe.source,
        source_id: recipe.sourceId,
        category: recipe.category,
        glass: recipe.glass,
        image: await importPhoto(recipe),
        translations: [
          {
            languages_code: LANGUAGE,
            steps: recipe.steps.map((text) => ({ text })),
          },
        ],
        ingredients: toLineRows(recipe, ingredientIds),
      });
      result.cocktailsCreated.push(recipe.name);
      // Two recipes of one run can share a name: the second one is then "found".
      existing.push({
        id: created.id,
        name: recipe.name,
        source: recipe.source,
        source_id: recipe.sourceId,
        image: "set",
      });
    } catch (error) {
      result.failures.push(`${recipe.name}: ${error instanceof Error ? error.message : error}`);
    }
  }

  return result;
}

function toLineRows(recipe: Recipe, ingredientIds: ReadonlyMap<string, string>) {
  return recipe.lines.map((line, index) => ({
    ingredient: ingredientIds.get(line.ingredientSlug),
    amount: line.amount,
    unit: line.unit,
    optional: line.optional,
    garnish: line.garnish,
    note: line.note,
    sort: index + 1,
  }));
}

/** Rewrites the recipe of an existing cocktail from its source. */
async function refreshCocktail(
  client: DirectusClient,
  cocktailId: string,
  recipe: Recipe,
  ingredientIds: ReadonlyMap<string, string>,
): Promise<void> {
  const current = await client.get<{
    translations: { id: number; languages_code: string }[];
  }>(`/items/cocktail/${cocktailId}`, { fields: "translations.id,translations.languages_code" });
  const translation = current.translations.find((item) => item.languages_code === LANGUAGE);
  const steps = recipe.steps.map((text) => ({ text }));

  await client.delete("/items/cocktail_ingredient", {
    query: { filter: { cocktail: { _eq: cocktailId } }, limit: -1 },
  });
  await client.post(
    "/items/cocktail_ingredient",
    toLineRows(recipe, ingredientIds).map((row) => ({ ...row, cocktail: cocktailId })),
  );
  await client.patch(`/items/cocktail/${cocktailId}`, {
    category: recipe.category,
    glass: recipe.glass,
    translations: {
      create: translation ? [] : [{ languages_code: LANGUAGE, steps }],
      update: translation ? [{ id: translation.id, steps }] : [],
      delete: [],
    },
  });
}

/** Makes sure every ingredient used by the recipes exists, parents included. */
async function syncIngredients(
  client: DirectusClient,
  recipes: readonly Recipe[],
  resolver: IngredientResolver,
  result: PushResult,
): Promise<Map<string, string>> {
  const rows = await client.get<IngredientRow[]>("/items/ingredient", {
    fields: "id,slug,parent",
    limit: -1,
  });
  const ids = new Map(rows.map((row) => [row.slug, row.id]));
  const parentOf = new Map(rows.map((row) => [row.slug, row.parent]));

  async function ensure(slug: string): Promise<string> {
    const ingredient = resolver.bySlug(slug);
    if (!ingredient) throw new Error(`Ingredient "${slug}" is not in the catalog`);

    // Parents first: a child row points to its parent.
    const parentId = ingredient.parent ? await ensure(ingredient.parent) : null;

    const existingId = ids.get(slug);
    if (existingId) {
      if (parentId && !parentOf.get(slug)) {
        await client.patch(`/items/ingredient/${existingId}`, { parent: parentId });
        parentOf.set(slug, parentId);
      }
      return existingId;
    }

    const created = await client.post<{ id: string }>("/items/ingredient", {
      slug,
      category: ingredient.category,
      parent: parentId,
      translations: Object.entries(ingredientNames(ingredient)).map(([languages_code, name]) => ({
        languages_code,
        name,
      })),
    });
    ids.set(slug, created.id);
    parentOf.set(slug, parentId);
    result.ingredientsCreated.push(slug);
    return created.id;
  }

  for (const recipe of recipes) {
    for (const line of recipe.lines) {
      await ensure(line.ingredientSlug);
    }
  }
  return ids;
}

async function findPictureFolder(client: DirectusClient): Promise<string> {
  const folders = await client.get<{ id: string }[]>("/folders", {
    filter: { name: { _eq: PICTURE_FOLDER } },
    limit: 1,
  });
  const folder = folders[0];
  if (!folder) {
    throw new Error(
      `Folder "${PICTURE_FOLDER}" not found: run huc-back/scripts/setup-cocktails.py`,
    );
  }
  return folder.id;
}
