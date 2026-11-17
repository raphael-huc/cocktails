import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { LoginScreen, sessionQueryOptions } from "@/modules/auth";
import { safeRedirect } from "../redirect";

const searchSchema = z.object({
  /** Path to return to once signed in. */
  redirect: z.string().optional().catch(undefined),
  error: z.enum(["sso"]).optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (user) throw redirect({ to: "/" });
  },
  component: LoginRoute,
});

function LoginRoute() {
  const search = Route.useSearch();
  const router = useRouter();

  return (
    <LoginScreen
      ssoFailed={search.error === "sso"}
      onSuccess={() => router.history.push(safeRedirect(search.redirect))}
    />
  );
}
