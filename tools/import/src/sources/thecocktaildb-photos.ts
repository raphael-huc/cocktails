import { z } from "zod";
import { fetchJsonCached } from "../cache.ts";
import { normalizeText, slugify } from "../normalize/text.ts";

/** TheCocktailDB, used here for its photos. "1" is the public test key. */
const API = "https://www.thecocktaildb.com/api/json/v1/1";

const searchResponse = z
  .object({
    // The API answers `"drinks": null`, or sometimes a message, when nothing matches.
    drinks: z
      .array(z.object({ strDrink: z.string(), strDrinkThumb: z.string().nullable() }))
      .nullable()
      .catch(null),
  })
  .nullable();

/** Cocktails that TheCocktailDB lists under another name. */
const OTHER_NAMES: Record<string, string> = {
  bacardi: "Bacardi Cocktail",
  tuxedo: "Tuxedo Cocktail",
  b52: "B-52",
  "god mother": "Godmother",
  "god father": "Godfather",
  "lemon drop martini": "Lemon Drop",
  "mai tai": "Mai Tai",
  "dark n stormy": "Dark and Stormy",
  "ramos fizz": "Ramos Gin Fizz",
};

function nameKey(name: string): string {
  return normalizeText(name).replace(/[^a-z0-9]/g, "");
}

/**
 * The API finds nothing when the searched text contains an apostrophe, so
 * "Horse's Neck" is searched as "Neck" and the exact name is picked from the
 * results.
 */
function searchTerm(name: string): string {
  if (!/['’]/.test(name)) return name;
  const plainWords = name.split(/\s+/).filter((word) => /^[\p{L}\d]+$/u.test(word));
  return plainWords.sort((a, b) => b.length - a.length)[0] ?? name;
}

/** URL of the photo of the cocktail with this exact name, if there is one. */
export async function findCocktailPhoto(name: string): Promise<string | null> {
  const searched = OTHER_NAMES[normalizeText(name)] ?? name;
  const term = searchTerm(searched);
  const url = `${API}/search.php?s=${encodeURIComponent(term)}`;
  const data = searchResponse.parse(
    await fetchJsonCached(url, `thecocktaildb/search-${slugify(term)}.json`),
  );

  // The search is a "contains": "Negroni" also returns "French Negroni".
  const match = data?.drinks?.find((drink) => nameKey(drink.strDrink) === nameKey(searched));
  return match?.strDrinkThumb ?? null;
}
