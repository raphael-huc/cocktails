import { Button } from "@cocktails/ui";
import { useQuery } from "@tanstack/react-query";
import { m } from "@/shared/i18n";
import { useSetShoppingIngredient } from "../application/shopping.mutations";
import { shoppingListQueryOptions } from "../application/shopping.queries";
import { hasIngredient } from "../domain/shopping-list";

export type ShoppingToggleProps = {
  ingredientId: string;
  /** Name of the ingredient, so the button says what it adds when read out of context. */
  name: string;
};

/**
 * Puts an ingredient on the shopping list, or takes it off. Shown next to an
 * ingredient the user is missing.
 */
export function ShoppingToggle({ ingredientId, name }: ShoppingToggleProps) {
  // Not suspending: the button appears inside pages that are already displayed.
  const { data: list } = useQuery(shoppingListQueryOptions());
  const setIngredient = useSetShoppingIngredient();
  const listed = list ? hasIngredient(list, ingredientId) : false;

  return (
    <Button
      variant={listed ? "ghost" : "secondary"}
      size="sm"
      aria-pressed={listed}
      aria-label={listed ? m.shopping_remove_named({ name }) : m.shopping_add_named({ name })}
      disabled={list === undefined}
      onClick={() => setIngredient.mutate({ ingredientId, listed: !listed })}
    >
      {listed ? `✓ ${m.shopping_listed()}` : `+ ${m.shopping_add()}`}
    </Button>
  );
}
