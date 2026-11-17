import { Button, buttonStyles, TextField } from "@cocktails/ui";
import type { FormEvent } from "react";
import { m } from "@/shared/i18n";

export type LoginFormProps = {
  onSubmit: (credentials: { email: string; password: string }) => void;
  googleUrl: string;
  pending: boolean;
  errorMessage: string | null;
};

export function LoginForm({ onSubmit, googleUrl, pending, errorMessage }: LoginFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <h1 className="font-display text-4xl">{m.login_title()}</h1>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-control border border-danger px-3 py-2 text-sm text-danger"
        >
          {errorMessage}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label={m.login_email()}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          label={m.login_password()}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {m.login_submit()}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        {m.login_or()}
        <span className="h-px flex-1 bg-line" />
      </div>

      <a href={googleUrl} className={buttonStyles({ variant: "secondary", size: "lg" })}>
        {m.login_google()}
      </a>
    </div>
  );
}
