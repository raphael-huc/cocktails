import { createItem, deleteItems, readItems } from "@directus/sdk";
import { z } from "zod";
import { parseResponse, send } from "@/shared/http/request";
import type { Pantry } from "../domain/pantry";
import { pantryItemDto } from "./pantry.dto";

/**
 * The rows of the signed-in user. Directus permissions enforce the same for a
 * regular account; stating it here keeps it true for an administrator too,
 * whom permissions do not restrict and who would otherwise read, and empty,
 * everybody's bar.
 */
const OWN_ROWS = { user_created: { _eq: "$CURRENT_USER" } } as const;

export async function fetchPantry(): Promise<Pantry> {
  const data = await send(
    readItems("pantry_item", { fields: ["ingredient"], filter: OWN_ROWS, limit: -1 }),
  );
  const items = parseResponse(z.array(pantryItemDto), data);
  return [...new Set(items.map((item) => item.ingredient))];
}

export async function addPantryIngredient(ingredientId: string): Promise<void> {
  await send(createItem("pantry_item", { ingredient: ingredientId }, { fields: ["id"] }));
}

export async function removePantryIngredient(ingredientId: string): Promise<void> {
  await send(
    deleteItems("pantry_item", { filter: { ...OWN_ROWS, ingredient: { _eq: ingredientId } } }),
  );
}
