import { QueryClient } from "@tanstack/react-query";
import { isAppError } from "@/shared/errors/app-error";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // Retrying only helps when the server could not be reached.
      retry: (failureCount, error) => isAppError(error, "network") && failureCount < 2,
    },
  },
});
