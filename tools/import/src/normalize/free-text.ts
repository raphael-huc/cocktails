import type { IngredientResolver } from "../catalog/resolve.ts";
import type { RecipeLine } from "./recipe.ts";
import { capitalize, normalizeText } from "./text.ts";

const OPTIONAL = /\boptional(ly)?\b/i;

/** "2 dashes Angostura bitters", "dash of cola", "3 to 4 dashes of …". */
const DASHES = /^(?:(\d+)(?: to \d+)?|a)?\s*dash(?:es)?\s+(?:of\s+)?(.+)$/;

/**
 * Turns a line written as free text into a recipe line.
 *
 * Only dashes become a real measure. Everything else ("6 Mint sprigs",
 * "Top with Prosecco", "Salt") keeps its wording as a note: the ingredient is
 * identified, which is what matching needs, and the user reads the original.
 *
 * Returns `null` when no known ingredient is mentioned.
 */
export function parseFreeTextLine(
  text: string,
  resolver: IngredientResolver,
  { garnish = false }: { garnish?: boolean } = {},
): RecipeLine | null {
  // "(small egg)", "(optional)": remarks, not part of the ingredient.
  const withoutRemarks = text.replace(/\s*\([^)]*\)/g, "").trim();
  const normalized = normalizeText(withoutRemarks);

  const ingredient = resolver.mentionedIn(normalized);
  if (!ingredient) return null;

  const line: RecipeLine = {
    ingredientSlug: ingredient.slug,
    amount: null,
    unit: null,
    optional: OPTIONAL.test(text) || ingredient.alwaysAvailable === true,
    garnish,
    note: null,
  };

  const dashes = DASHES.exec(normalized);
  if (dashes?.[2] && resolver.exact(dashes[2]) === ingredient) {
    return { ...line, amount: Number(dashes[1] ?? 1), unit: "dash" };
  }

  // The text is just the ingredient name ("Soda water"): nothing to add.
  if (resolver.exact(normalized) === ingredient) return line;

  const wording = withoutRemarks
    .replace(OPTIONAL, "")
    .replace(/^(an?|and)\s+/i, "")
    .trim();
  return { ...line, note: capitalize(wording) };
}
