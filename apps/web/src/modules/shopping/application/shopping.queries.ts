import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchShoppingList } from "../http/shopping.repository";

export function shoppingListQueryOptions() {
  return queryOptions({
    queryKey: ["shopping-list"] as const,
    queryFn: fetchShoppingList,
  });
}

/**
 * How many items are on the list, or `undefined` while it loads. Does not
 * suspend: meant for places such as the navigation, which must not wait.
 */
export function useShoppingListCount(): number | undefined {
  return useQuery(shoppingListQueryOptions()).data?.length;
}
