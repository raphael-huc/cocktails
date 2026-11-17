import { authentication, createDirectus, rest } from "@directus/sdk";
import type { Schema } from "./schema";

export const DIRECTUS_URL: string = import.meta.env.VITE_DIRECTUS_URL;

/**
 * Session mode: Directus keeps the session in an httpOnly cookie, so no token
 * is ever readable from JavaScript or stored by the application.
 */
export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(authentication("session", { credentials: "include" }))
  .with(rest({ credentials: "include" }));
