import type { DirectusClient } from "./client.ts";

/** The image sizes the application asks for, declared in huc-back/scripts/setup-cocktails.py. */
const PRESETS = ["cocktail-thumbnail", "cocktail-photo"];
const PARALLEL_REQUESTS = 4;

/**
 * Asks Directus for every size of every cocktail photo once.
 *
 * Directus resizes an image the first time a size is requested, then keeps the
 * file. Doing it here means the first visitor of the application gets pictures
 * immediately instead of waiting for hundreds of images to be generated.
 * Returns how many images were requested.
 */
export async function warmCocktailPhotos(client: DirectusClient): Promise<number> {
  const cocktails = await client.get<{ image: string | null }[]>("/items/cocktail", {
    fields: "image",
    filter: { image: { _nnull: true } },
    limit: -1,
  });

  const paths = cocktails.flatMap(({ image }) =>
    PRESETS.map((preset) => `/assets/${image}?key=${preset}`),
  );

  let next = 0;
  async function worker(): Promise<void> {
    while (next < paths.length) {
      const path = paths[next++];
      if (path) await client.download(path);
    }
  }
  await Promise.all(Array.from({ length: PARALLEL_REQUESTS }, worker));

  return paths.length;
}
