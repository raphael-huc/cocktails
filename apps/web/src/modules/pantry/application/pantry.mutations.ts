import { useMutation, useQueryClient } from "@tanstack/react-query";
import { withIngredient, withoutIngredient } from "../domain/pantry";
import { addPantryIngredient, removePantryIngredient } from "../http/pantry.repository";
import { pantryQueryOptions } from "./pantry.queries";

const mutationKey = ["pantry", "set-ingredient"] as const;

/** Adds or removes an ingredient. The interface updates before the server answers. */
export function useSetPantryIngredient() {
  const queryClient = useQueryClient();
  const { queryKey } = pantryQueryOptions();

  return useMutation({
    mutationKey,
    // Run one at a time, so that quick taps reach the server in order.
    scope: { id: "pantry" },
    mutationFn: ({ ingredientId, owned }: { ingredientId: string; owned: boolean }) =>
      owned ? addPantryIngredient(ingredientId) : removePantryIngredient(ingredientId),

    onMutate: async ({ ingredientId, owned }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (pantry = []) =>
        owned ? withIngredient(pantry, ingredientId) : withoutIngredient(pantry, ingredientId),
      );
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
