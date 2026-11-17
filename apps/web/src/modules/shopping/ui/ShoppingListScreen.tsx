import { useSuspenseQuery } from "@tanstack/react-query";
import { ingredientNames, ingredientsQueryOptions } from "@/modules/catalog";
import { pantryQueryOptions } from "@/modules/pantry";
import { m } from "@/shared/i18n";
import {
  useAddShoppingLabel,
  useMarkBought,
  useRemoveShoppingItem,
} from "../application/shopping.mutations";
import { shoppingListQueryOptions } from "../application/shopping.queries";
import { toShoppingEntries } from "../domain/shopping-list";
import { ShoppingList } from "./ShoppingList";

/** What the signed-in user plans to buy: missing ingredients and anything else. */
export function ShoppingListScreen() {
  const { data: ingredients } = useSuspenseQuery(ingredientsQueryOptions());
  const { data: list } = useSuspenseQuery(shoppingListQueryOptions());
  const { data: pantry } = useSuspenseQuery(pantryQueryOptions());
  const removeItem = useRemoveShoppingItem();
  const { addLabel, isPending: adding } = useAddShoppingLabel();
  const markBought = useMarkBought();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-5xl">{m.shopping_title()}</h1>
        <p className="max-w-prose text-ink-muted">{m.shopping_intro()}</p>
      </header>
      <ShoppingList
        entries={toShoppingEntries(list, ingredientNames(ingredients), new Set(pantry))}
        onBought={markBought}
        onRemove={(id) => removeItem.mutate(id)}
        onAdd={addLabel}
        adding={adding}
      />
    </div>
  );
}
