import { Button } from "@cocktails/ui";
import { m } from "@/shared/i18n";
import { useLogout } from "../application/session.mutations";

export function LogoutButton({ onLoggedOut }: { onLoggedOut: () => void }) {
  const logout = useLogout();

  return (
    <Button
      variant="ghost"
      disabled={logout.isPending}
      onClick={() => logout.mutate(undefined, { onSettled: onLoggedOut })}
    >
      {m.auth_sign_out()}
    </Button>
  );
}
