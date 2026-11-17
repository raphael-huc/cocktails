import { useMutation, useQueryClient } from "@tanstack/react-query";
import { googleLoginUrl, login, logout } from "../http/auth.repository";
import { sessionQueryOptions } from "./session.queries";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      await login(credentials);
      // Load the user before resolving so route guards see the new session.
      return queryClient.fetchQuery({ ...sessionQueryOptions(), staleTime: 0 });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    // Nothing cached belongs to the next user.
    onSettled: () => {
      queryClient.clear();
    },
  });
}

/** Where the "Continue with Google" link points to. */
export function getGoogleLoginUrl(): string {
  return googleLoginUrl(new URL("/auth/callback", window.location.origin).toString());
}
