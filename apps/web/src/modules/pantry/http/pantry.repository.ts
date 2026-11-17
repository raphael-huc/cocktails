import { createItem, deleteItems, readItems } from "@directus/sdk";
import { z } from "zod";
import { parseResponse, send } from "@/shared/http/request";
import type { Pantry } from "../domain/pantry";
import { pantryItemDto } from "./pantry.dto";

/*
 * No user filter here on purpose: Directus permissions restrict `pantry_item`
 * to the rows created by the signed-in user, for reads and deletions alike.
 */

export async function fetchPantry(): Promise<Pantry> {
  const data = await send(readItems("pantry_item", { fields: ["ingredient"], limit: -1 }));
  const items = parseResponse(z.array(pantryItemDto), data);
  return [...new Set(items.map((item) => item.ingredient))];
}

export async function addPantryIngredient(ingredientId: string): Promise<void> {
  await send(createItem("pantry_item", { ingredient: ingredientId }, { fields: ["id"] }));
}

export async function removePantryIngredient(ingredientId: string): Promise<void> {
  await send(deleteItems("pantry_item", { filter: { ingredient: { _eq: ingredientId } } }));
}
