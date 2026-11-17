/**
 * Something the user wants to buy.
 *
 * The list is not specific to cocktails: an item is a free label ("Limes",
 * "Potting soil"), a link to an ingredient of the catalog, or both. Other
 * applications sharing the list may link their own kinds of items; here they
 * simply show up by their label.
 */
export type ShoppingItem = {
  id: string;
  ingredientId: string | null;
  label: string | null;
};

export type ShoppingList = readonly ShoppingItem[];

export function hasIngredient(list: ShoppingList, ingredientId: string): boolean {
  return list.some((item) => item.ingredientId === ingredientId);
}

/** The list with this ingredient on it. `id` identifies the new item until the server names it. */
export function withIngredient(list: ShoppingList, ingredientId: string, id: string): ShoppingList {
  return hasIngredient(list, ingredientId) ? list : [...list, { id, ingredientId, label: null }];
}

export function withoutIngredient(list: ShoppingList, ingredientId: string): ShoppingList {
  return list.filter((item) => item.ingredientId !== ingredientId);
}

export function withoutItem(list: ShoppingList, id: string): ShoppingList {
  return list.filter((item) => item.id !== id);
}

/** What the user typed, ready to store, or `null` when there is nothing to add. */
export function cleanLabel(input: string): string | null {
  const label = input.replace(/\s+/g, " ").trim();
  return label === "" ? null : label;
}

/** One line of the list, ready to display. */
export type ShoppingEntry = {
  id: string;
  name: string;
  /** Set when the item is an ingredient: it can then be moved to the bar. */
  ingredientId: string | null;
  /** The ingredient is already in the user's bar. Always `false` for other items. */
  owned: boolean;
};

/**
 * The list in the order it is shown: what is still to buy first, then the
 * ingredients the bar already has, each by name.
 *
 * An ingredient is shown by its name in the catalog. An item with neither a
 * label nor a known ingredient has nothing to show and is left out.
 */
export function toShoppingEntries(
  list: ShoppingList,
  ingredientNames: ReadonlyMap<string, string>,
  ownedIngredientIds: ReadonlySet<string>,
): ShoppingEntry[] {
  return list
    .flatMap((item): ShoppingEntry[] => {
      const ingredientName = item.ingredientId ? ingredientNames.get(item.ingredientId) : undefined;
      const name = ingredientName ?? item.label;
      if (!name) return [];
      return [
        {
          id: item.id,
          name,
          ingredientId: ingredientName ? item.ingredientId : null,
          owned: ingredientName !== undefined && ownedIngredientIds.has(item.ingredientId ?? ""),
        },
      ];
    })
    .toSorted((a, b) => Number(a.owned) - Number(b.owned) || a.name.localeCompare(b.name));
}
