import { isAppError } from "@/shared/errors/app-error";
import { m } from "@/shared/i18n";
import { getGoogleLoginUrl, useLogin } from "../application/session.mutations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LoginForm } from "./LoginForm";

export type LoginScreenProps = {
  onSuccess: () => void;
  /** Set when the browser comes back from a failed Google sign-in. */
  ssoFailed?: boolean;
};

export function LoginScreen({ onSuccess, ssoFailed = false }: LoginScreenProps) {
  const login = useLogin();

  let errorMessage: string | null = null;
  if (login.isError) {
    errorMessage = isAppError(login.error, "unauthorized")
      ? m.login_error_invalid()
      : m.login_error_generic();
  } else if (ssoFailed && !login.isPending) {
    errorMessage = m.login_error_sso();
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center p-6">
      {/* Nobody is signed in yet: the choice is kept in this browser. */}
      <div className="absolute top-5 right-5">
        <LanguageSwitcher />
      </div>
      <LoginForm
        googleUrl={getGoogleLoginUrl()}
        pending={login.isPending}
        errorMessage={errorMessage}
        onSubmit={(credentials) => login.mutate(credentials, { onSuccess })}
      />
    </main>
  );
}
