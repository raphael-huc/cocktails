import { createFileRoute, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/modules/auth";

/**
 * Where Directus sends the browser back after a Google sign-in. On success the
 * session cookie is already set; on failure Directus adds a `reason` parameter.
 */
export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search) => ({
    reason: typeof search.reason === "string" ? search.reason : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    if (!search.reason) {
      const user = await context.queryClient.fetchQuery({
        ...sessionQueryOptions(),
        staleTime: 0,
      });
      if (user) throw redirect({ to: "/" });
    }
    throw redirect({ to: "/login", search: { error: "sso" } });
  },
});
