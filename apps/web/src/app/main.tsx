import "./styles/index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { sessionQueryKey } from "@/modules/auth";
import { isAppError } from "@/shared/errors/app-error";
import { getLocale } from "@/shared/i18n";
import { queryClient } from "./query-client";
import { router } from "./router";

// Tell the browser and assistive technologies which language the page is in.
document.documentElement.lang = getLocale();

// When the session expires in the middle of a visit, any request can be the
// first to learn about it: forget the user and let the route guard redirect.
queryClient.getQueryCache().subscribe((event) => {
  if (
    event.type === "updated" &&
    event.action.type === "error" &&
    isAppError(event.action.error, "unauthorized")
  ) {
    queryClient.setQueryData(sessionQueryKey, null);
    void router.invalidate();
  }
});

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
