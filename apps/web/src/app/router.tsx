import { createRouter } from "@tanstack/react-router";
import { RouteError, RoutePending } from "./layout/RouteStatus";
import { queryClient } from "./query-client";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  // Freshness is decided by the query cache, not by the router.
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: RouteError,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
