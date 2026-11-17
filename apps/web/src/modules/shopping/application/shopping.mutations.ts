import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetPantryIngredient } from "@/modules/pantry";
import {
  cleanLabel,
  type ShoppingList,
  withIngredient,
  withoutIngredient,
  withoutItem,
} from "../domain/shopping-list";
import {
  addShoppingIngredient,
  addShoppingLabel,
  removeShoppingIngredient,
  removeShoppingItem,
} from "../http/shopping.repository";
import { shoppingListQueryOptions } from "./shopping.queries";

const mutationKey = ["shopping-list", "change"] as const;

/**
 * A change to the list that shows at once, before the server answers, and is
 * undone if the server refuses it. Changes run one at a time, so that quick
 * taps reach the server in order.
 */
function useOptimisticChange<Variables>(options: {
  send: (variables: Variables) => Promise<void>;
  apply: (list: ShoppingList, variables: Variables) => ShoppingList;
}) {
  const queryClient = useQueryClient();
  const { queryKey } = shoppingListQueryOptions();

  return useMutation({
    mutationKey,
    scope: { id: "shopping-list" },
    mutationFn: options.send,

    onMutate: async (variables: Variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (list = []) => options.apply(list, variables));
      return { previous };
    },

    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },

    onSettled: () => {
      // Refetching while other changes are in flight would undo their optimistic state.
      if (queryClient.isMutating({ mutationKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

/** Puts an ingredient of the catalog on the list, or takes it off. */
export function useSetShoppingIngredient() {
  return useOptimisticChange({
    send: ({ ingredientId, listed }: { ingredientId: string; listed: boolean }) =>
      listed ? addShoppingIngredient(ingredientId) : removeShoppingIngredient(ingredientId),
    apply: (list, { ingredientId, listed }) =>
      listed
        ? // A stand-in id, replaced by the server's when the list is read again.
          withIngredient(list, ingredientId, `pending:${ingredientId}`)
        : withoutIngredient(list, ingredientId),
  });
}

/** Takes any item off the list. */
export function useRemoveShoppingItem() {
  return useOptimisticChange({ send: removeShoppingItem, apply: withoutItem });
}

/**
 * Adds something that is not an ingredient of the catalog, in the user's own
 * words. Not optimistic: the list is read again once the item exists, so the
 * new line always carries its real id and can be removed straight away.
 */
export function useAddShoppingLabel() {
  const queryClient = useQueryClient();
  const { queryKey } = shoppingListQueryOptions();

  const mutation = useMutation({
    mutationFn: addShoppingLabel,
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    isPending: mutation.isPending,
    /** Returns whether there was something to add. */
    addLabel: (input: string): boolean => {
      const label = cleanLabel(input);
      if (label) mutation.mutate(label);
      return label !== null;
    },
  };
}

/**
 * "I bought it": the ingredient joins the bar and leaves the list.
 *
 * The bar comes first. If taking it off the list then fails, the ingredient is
 * shown as already owned and can be removed again, rather than being lost.
 */
export function useMarkBought() {
  const setPantryIngredient = useSetPantryIngredient();
  const setShoppingIngredient = useSetShoppingIngredient();

  return (ingredientId: string) => {
    setPantryIngredient.mutate(
      { ingredientId, owned: true },
      { onSuccess: () => setShoppingIngredient.mutate({ ingredientId, listed: false }) },
    );
  };
}
