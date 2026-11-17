/**
 * Errors the application reasons about. The http layer converts whatever the
 * backend or the network throws into one of these, so that the rest of the code
 * never depends on the shape of a Directus error.
 */
export type AppErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "network"
  | "invalid-response"
  | "unexpected";

export class AppError extends Error {
  readonly kind: AppErrorKind;

  constructor(kind: AppErrorKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.kind = kind;
  }
}

export function isAppError(error: unknown, kind?: AppErrorKind): error is AppError {
  return error instanceof AppError && (kind === undefined || error.kind === kind);
}
