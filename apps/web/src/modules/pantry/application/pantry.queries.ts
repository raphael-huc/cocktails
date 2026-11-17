import { queryOptions } from "@tanstack/react-query";
import { fetchPantry } from "../http/pantry.repository";

export function pantryQueryOptions() {
  return queryOptions({
    queryKey: ["pantry"] as const,
    queryFn: fetchPantry,
  });
}
