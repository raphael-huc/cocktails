import "../src/app/styles/index.css";
import type { Decorator, Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { type ComponentType, createContext, useContext, useState } from "react";
import { sb } from "storybook/test";
import { overwriteGetLocale } from "../src/shared/i18n/paraglide/runtime.js";

// Stories assert on English copy: do not follow the language of the browser running them.
overwriteGetLocale(() => "en");

// Stories never reach Directus: every export of the repository becomes a mock
// that resolves to `undefined`.
sb.mock(import("../src/modules/auth/http/auth.repository.ts"));

const StoryContext = createContext<ComponentType | null>(null);

function StoryOutlet() {
  const Story = useContext(StoryContext);
  return Story ? <Story /> : null;
}

/**
 * A router that only knows the addresses components link to, so `<Link>`
 * renders a real `href` without loading the application's route tree.
 */
function createStoryRouter() {
  const rootRoute = createRootRoute({ component: StoryOutlet });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: "/" }),
    createRoute({ getParentRoute: () => rootRoute, path: "/cocktails" }),
    createRoute({ getParentRoute: () => rootRoute, path: "/cocktails/$cocktailId" }),
    createRoute({ getParentRoute: () => rootRoute, path: "/cocktails/$cocktailId/make" }),
  ]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

function StoryProviders({ Story }: { Story: ComponentType }) {
  // One cache and one router per story, so nothing leaks from one to the next.
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const [router] = useState(createStoryRouter);

  return (
    <QueryClientProvider client={queryClient}>
      <StoryContext value={Story}>
        <RouterProvider router={router} />
      </StoryContext>
    </QueryClientProvider>
  );
}

const withProviders: Decorator = (Story) => <StoryProviders Story={Story} />;

const preview: Preview = {
  decorators: [withProviders],
  parameters: {
    layout: "padded",
  },
};

export default preview;
