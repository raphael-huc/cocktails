import { queryOptions } from "@tanstack/react-query";
import { fetchCurrentUser } from "../http/auth.repository";

export const sessionQueryKey = ["auth", "session"] as const;

/** The signed-in user (`null` when signed out). Cached for the whole visit. */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
