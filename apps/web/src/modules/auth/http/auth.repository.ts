import { readMe, updateMe } from "@directus/sdk";
import { isAppError } from "@/shared/errors/app-error";
import { DIRECTUS_URL, directus } from "@/shared/http/directus";
import { parseResponse, send, toAppError } from "@/shared/http/request";
import type { User } from "../domain/user";
import { userDto } from "./auth.dto";
import { toUser } from "./auth.mapper";

/** The signed-in user, or `null` when there is no valid session. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const data = await send(
      readMe({ fields: ["id", "email", "first_name", "last_name", "language"] }),
    );
    return toUser(parseResponse(userDto, data));
  } catch (error) {
    if (isAppError(error, "unauthorized")) return null;
    throw error;
  }
}

/** Saves the language chosen for the account, as a Directus code such as "fr-FR". */
export async function updateLanguage(language: string): Promise<void> {
  await send(updateMe({ language }, { fields: ["id"] }));
}

export async function login(credentials: { email: string; password: string }): Promise<void> {
  try {
    await directus.login(credentials);
  } catch (error) {
    throw toAppError(error);
  }
}

export async function logout(): Promise<void> {
  try {
    await directus.logout();
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Address that starts the Google sign-in. Directus runs the exchange with
 * Google, sets the session cookie, then sends the browser to `returnUrl`.
 */
export function googleLoginUrl(returnUrl: string): string {
  const url = new URL("/auth/login/google", DIRECTUS_URL);
  url.searchParams.set("redirect", returnUrl);
  return url.toString();
}
