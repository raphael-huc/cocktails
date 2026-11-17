import { createItem, deleteItem, deleteItems, readItems } from "@directus/sdk";
import { z } from "zod";
import { parseResponse, send } from "@/shared/http/request";
import type { ShoppingList } from "../domain/shopping-list";

const shoppingItemDto = z.object({
  id: z.string(),
  ingredient: z.string().nullable(),
  label: z.string().nullable(),
});

/*
 * No user filter here on purpose: Directus permissions restrict
 * `shopping_item` to the rows created by the signed-in user, for reads and
 * deletions alike.
 */

export async function fetchShoppingList(): Promise<ShoppingList> {
  const data = await send(
    readItems("shopping_item", { fields: ["id", "ingredient", "label"], limit: -1 }),
  );
  return parseResponse(z.array(shoppingItemDto), data).map((item) => ({
    id: item.id,
    ingredientId: item.ingredient,
    label: item.label,
  }));
}

export async function addShoppingIngredient(ingredientId: string): Promise<void> {
  await send(createItem("shopping_item", { ingredient: ingredientId }, { fields: ["id"] }));
}

export async function addShoppingLabel(label: string): Promise<void> {
  await send(createItem("shopping_item", { label }, { fields: ["id"] }));
}

export async function removeShoppingIngredient(ingredientId: string): Promise<void> {
  await send(deleteItems("shopping_item", { filter: { ingredient: { _eq: ingredientId } } }));
}

export async function removeShoppingItem(id: string): Promise<void> {
  await send(deleteItem("shopping_item", id));
}
