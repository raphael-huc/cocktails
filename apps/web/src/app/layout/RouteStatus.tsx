import { Button } from "@cocktails/ui";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { m } from "@/shared/i18n";

export function RoutePending() {
  return (
    <p role="status" className="py-12 text-center text-ink-muted">
      {m.loading()}
    </p>
  );
}

export function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrors = useQueryErrorResetBoundary();

  function retry() {
    queryErrors.reset();
    reset();
    void router.invalidate();
  }

  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-12">
      <p className="font-display text-2xl">{m.error_title()}</p>
      <Button variant="secondary" onClick={retry}>
        {m.error_retry()}
      </Button>
    </div>
  );
}
