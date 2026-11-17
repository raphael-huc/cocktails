import { createItem, deleteItems, readItems } from "@directus/sdk";
import { z } from "zod";
import { parseResponse, send } from "@/shared/http/request";
import type { ShoppingList } from "../domain/shopping-list";

/**
 * The collection is shared by every application of the workspace, each keeping
 * its own list in it. This is the value that marks an item as ours: items
 * added from another application are neither shown nor touched here.
 */
const APP = "cocktails";

/**
 * Our items, of the signed-in user. Directus permissions enforce the same for
 * a regular account; stating it here keeps it true for an administrator too,
 * whom permissions do not restrict.
 */
const OWN_ITEMS = {
  app: { _eq: APP },
  user_created: { _eq: "$CURRENT_USER" },
} as const;

const shoppingItemDto = z.object({
  id: z.string(),
  ingredient: z.string().nullable(),
  label: z.string().nullable(),
});

export async function fetchShoppingList(): Promise<ShoppingList> {
  const data = await send(
    readItems("shopping_item", {
      fields: ["id", "ingredient", "label"],
      filter: OWN_ITEMS,
      limit: -1,
    }),
  );
  return parseResponse(z.array(shoppingItemDto), data).map((item) => ({
    id: item.id,
    ingredientId: item.ingredient,
    label: item.label,
  }));
}

export async function addShoppingIngredient(ingredientId: string): Promise<void> {
  await send(
    createItem("shopping_item", { app: APP, ingredient: ingredientId }, { fields: ["id"] }),
  );
}

export async function addShoppingLabel(label: string): Promise<void> {
  await send(createItem("shopping_item", { app: APP, label }, { fields: ["id"] }));
}

export async function removeShoppingIngredient(ingredientId: string): Promise<void> {
  await send(
    deleteItems("shopping_item", { filter: { ...OWN_ITEMS, ingredient: { _eq: ingredientId } } }),
  );
}

export async function removeShoppingItem(id: string): Promise<void> {
  await send(deleteItems("shopping_item", { filter: { ...OWN_ITEMS, id: { _eq: id } } }));
}
