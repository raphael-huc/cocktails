import { DIRECTUS_URL } from "./directus";

/**
 * Image sizes declared in the Directus settings by
 * `huc-back/scripts/setup-cocktails.py`. Asking for a named size, rather than
 * free dimensions, lets the import tool generate the files in advance.
 */
export type ImagePreset = "cocktail-thumbnail" | "cocktail-photo";

/** URL of a Directus image in one of the declared sizes. The session cookie authorises it. */
export function assetUrl(fileId: string, preset: ImagePreset): string {
  const url = new URL(`/assets/${fileId}`, DIRECTUS_URL);
  url.searchParams.set("key", preset);
  return url.toString();
}
