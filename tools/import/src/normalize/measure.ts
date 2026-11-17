import type { Unit } from "./recipe.ts";

export type Measure = {
  amount: number;
  unit: Unit;
  /** Words that followed the unit, as in "4 oz chilled": they qualify the ingredient. */
  qualifier: string | null;
};

/** Millilitres per unit, with the round values bartenders use (1 oz = 30 ml). */
const MILLILITRES: Record<string, number> = {
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
  oz: 30,
  tsp: 5,
  teaspoon: 5,
  tblsp: 15,
  tbsp: 15,
  tablespoon: 15,
  shot: 45,
  jigger: 45,
  cup: 240,
  pint: 470,
  qt: 950,
  quart: 950,
  gal: 3800,
  gallon: 3800,
  // A "fifth" is the standard 75 cl bottle.
  fifth: 750,
};

const FRACTION_CHARACTERS: Record<string, string> = {
  "½": " 1/2",
  "⅓": " 1/3",
  "⅔": " 2/3",
  "¼": " 1/4",
  "¾": " 3/4",
};

/** "1", "1.5", "1/2", "1 1/2", and ranges such as "2-3", read as their start. */
const QUANTITY = String.raw`(\d+(?:\.\d+)?)(?:\s+(\d+)\/(\d+)|\/(\d+))?(?:\s*-\s*\d+(?:\.\d+)?(?:\/\d+)?)?`;
const MEASURE = new RegExp(`^${QUANTITY}\\s*([a-z]+)\\.?(?:\\s+(.+))?$`, "i");

/**
 * Reads a measure written as text: "1 1/2 oz" is 45 ml, "2 dashes" is two
 * dashes. Returns `null` for anything that does not start with a quantity and
 * a known unit ("Juice of 1", "1 part", "Top"): the caller keeps the wording.
 */
export function parseMeasure(text: string): Measure | null {
  const plain = text.replace(
    /[½⅓⅔¼¾]/g,
    (character) => FRACTION_CHARACTERS[character] ?? character,
  );
  const match = MEASURE.exec(plain.trim().replace(/\s+/g, " "));
  if (!match) return null;

  const [, whole, numerator, denominator, simpleDenominator, rawUnit, rest] = match;
  let quantity = Number(whole);
  if (numerator && denominator) quantity += Number(numerator) / Number(denominator);
  if (simpleDenominator) quantity /= Number(simpleDenominator);
  if (!Number.isFinite(quantity) || quantity <= 0 || !rawUnit) return null;

  const unit = rawUnit.toLowerCase();
  const qualifier = rest?.trim() || null;

  if (unit === "dash" || unit === "dashes") return { amount: quantity, unit: "dash", qualifier };

  // "cups" and "shots" are the plural of a known unit.
  const factor = MILLILITRES[unit] ?? MILLILITRES[unit.replace(/s$/, "")];
  if (!factor) return null;

  return { amount: Math.round(quantity * factor * 10) / 10, unit: "ml", qualifier };
}
