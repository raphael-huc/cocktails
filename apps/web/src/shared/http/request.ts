import { isDirectusError, type RestCommand } from "@directus/sdk";
import type { z } from "zod";
import { AppError } from "@/shared/errors/app-error";
import { directus } from "./directus";
import type { Schema } from "./schema";

/** Runs a Directus command and converts any failure into an `AppError`. */
export async function send<Output>(command: RestCommand<Output, Schema>): Promise<Output> {
  try {
    return await directus.request(command);
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Validates a response against the shape the application expects. A mismatch
 * surfaces here, at the boundary, instead of as an obscure failure in the UI.
 */
export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError("invalid-response", "The server returned unexpected data.", {
      cause: result.error,
    });
  }
  return result.data;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (isDirectusError(error)) {
    const status = error.response?.status;
    const message = error.errors?.[0]?.message ?? "The request failed.";
    if (status === 401) return new AppError("unauthorized", message, { cause: error });
    if (status === 403) return new AppError("forbidden", message, { cause: error });
    if (status === 404) return new AppError("not-found", message, { cause: error });
    return new AppError("unexpected", message, { cause: error });
  }

  // `fetch` rejects with a TypeError when the server cannot be reached.
  if (error instanceof TypeError) {
    return new AppError("network", "The server could not be reached.", { cause: error });
  }

  return new AppError("unexpected", "An unexpected error occurred.", { cause: error });
}
