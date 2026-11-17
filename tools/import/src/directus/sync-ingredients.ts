import type { CatalogIngredient } from "../catalog/ingredients.ts";
import type { IngredientResolver } from "../catalog/resolve.ts";
import type { DirectusClient } from "./client.ts";

/** Directus language code of each name of a catalog ingredient. */
export function ingredientNames(ingredient: CatalogIngredient): Record<string, string> {
  return { "en-US": ingredient.name, "fr-FR": ingredient.nameFr };
}

export type SyncResult = {
  /** "old → new": recipes and bar entries moved, old ingredient deleted. */
  merged: string[];
  /** Ingredients whose category or parent was corrected. */
  reorganised: string[];
  /** "slug (language)": names added or corrected. */
  renamed: string[];
  /** Parents the catalog asks for that did not exist yet. */
  created: string[];
  /** In Directus but not in the catalog: left alone. */
  unknown: string[];
};

type TranslationRow = { id: number; languages_code: string; name: string };
type IngredientRow = {
  id: string;
  slug: string;
  category: string;
  parent: string | null;
  translations: TranslationRow[];
};

/**
 * Brings the ingredients of Directus in line with the catalog: merges, names
 * in every language, category and hierarchy. It only touches ingredients that
 * exist in Directus (plus the parents they need) and can be run again.
 *
 * The catalog wins: a name or a parent edited by hand in Directus is put back.
 */
export async function syncIngredients(
  client: DirectusClient,
  catalog: readonly CatalogIngredient[],
  resolver: IngredientResolver,
): Promise<SyncResult> {
  const result: SyncResult = { merged: [], reorganised: [], renamed: [], created: [], unknown: [] };

  const rows = await client.get<IngredientRow[]>("/items/ingredient", {
    fields: "id,slug,category,parent,translations.id,translations.languages_code,translations.name",
    limit: -1,
  });
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  async function ensure(slug: string): Promise<IngredientRow> {
    const existing = bySlug.get(slug);
    if (existing) return existing;

    const ingredient = resolver.bySlug(slug);
    if (!ingredient) throw new Error(`Ingredient "${slug}" is not in the catalog`);
    const parent = ingredient.parent ? await ensure(ingredient.parent) : null;

    const created = await client.post<{ id: string }>("/items/ingredient", {
      slug,
      category: ingredient.category,
      parent: parent?.id ?? null,
      translations: Object.entries(ingredientNames(ingredient)).map(([languages_code, name]) => ({
        languages_code,
        name,
      })),
    });
    const row: IngredientRow = {
      id: created.id,
      slug,
      category: ingredient.category,
      parent: parent?.id ?? null,
      // Marked as up to date: the row was created with the catalog's names.
      translations: Object.entries(ingredientNames(ingredient)).map(
        ([languages_code, name], index) => ({ id: -index - 1, languages_code, name }),
      ),
    };
    bySlug.set(slug, row);
    result.created.push(slug);
    return row;
  }

  // 1. Merges first, so the rest works on the final set of ingredients.
  for (const ingredient of catalog) {
    for (const oldSlug of ingredient.replaces ?? []) {
      const old = bySlug.get(oldSlug);
      if (!old) continue;
      const target = await ensure(ingredient.slug);
      await mergeIngredient(client, old.id, target.id);
      bySlug.delete(oldSlug);
      for (const row of bySlug.values()) {
        if (row.parent === old.id) row.parent = target.id;
      }
      result.merged.push(`${oldSlug} → ${ingredient.slug}`);
    }
  }

  // 2. Category, parent and names of everything the catalog knows.
  for (const row of [...bySlug.values()]) {
    const ingredient = resolver.bySlug(row.slug);
    if (!ingredient) {
      result.unknown.push(row.slug);
      continue;
    }

    const parentId = ingredient.parent ? (await ensure(ingredient.parent)).id : null;
    const changes: Record<string, unknown> = {};
    if (row.category !== ingredient.category) changes.category = ingredient.category;
    if (row.parent !== parentId) changes.parent = parentId;
    if (Object.keys(changes).length > 0) result.reorganised.push(row.slug);

    const create: { languages_code: string; name: string }[] = [];
    const update: { id: number; name: string }[] = [];
    for (const [language, name] of Object.entries(ingredientNames(ingredient))) {
      const translation = row.translations.find((item) => item.languages_code === language);
      if (!translation) create.push({ languages_code: language, name });
      else if (translation.name !== name) update.push({ id: translation.id, name });
      else continue;
      result.renamed.push(`${row.slug} (${language})`);
    }
    if (create.length > 0 || update.length > 0) {
      changes.translations = { create, update, delete: [] };
    }

    if (Object.keys(changes).length > 0) {
      await client.patch(`/items/ingredient/${row.id}`, changes);
    }
  }

  return result;
}

/** Moves every use of an ingredient to another one, then deletes it. */
async function mergeIngredient(client: DirectusClient, oldId: string, targetId: string) {
  const usedBy = { filter: { ingredient: { _eq: oldId } }, limit: -1 };

  await client.patch("/items/cocktail_ingredient", {
    query: usedBy,
    data: { ingredient: targetId },
  });

  // A bar holds an ingredient once: a user who has both keeps the target only.
  const entries = await client.get<{ id: string; user_created: string }[]>("/items/pantry_item", {
    fields: "id,user_created",
    ...usedBy,
  });
  const alreadyOwned = await client.get<{ user_created: string }[]>("/items/pantry_item", {
    fields: "user_created",
    filter: { ingredient: { _eq: targetId } },
    limit: -1,
  });
  const owners = new Set(alreadyOwned.map((entry) => entry.user_created));
  for (const entry of entries) {
    if (owners.has(entry.user_created)) await client.delete(`/items/pantry_item/${entry.id}`);
    else await client.patch(`/items/pantry_item/${entry.id}`, { ingredient: targetId });
  }

  await client.patch("/items/ingredient", {
    query: { filter: { parent: { _eq: oldId } }, limit: -1 },
    data: { parent: targetId },
  });
  await client.delete(`/items/ingredient/${oldId}`);
}
