import { createFileRoute, redirect } from "@tanstack/react-router";
import { followAccountLanguage, sessionQueryOptions } from "@/modules/auth";
import { AppShell } from "../layout/AppShell";

/** Every route under this one requires a signed-in user. */
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    // The language saved on the account wins over this browser's.
    followAccountLanguage(user);
    return { user };
  },
  component: AppShell,
});
