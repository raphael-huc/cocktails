import { capitalize } from "./text.ts";

/** Sign-offs, and numbering left alone on its own line, are not instructions. */
const NOT_A_STEP = /^(enjoy|cheers)\W*$|^\(?\d{1,2}[.)]?$/i;

/**
 * Splits a paragraph of instructions into one step per sentence, and tidies
 * what community recipes tend to contain: hand-written numbering, shouting,
 * strings of exclamation marks, "Enjoy!".
 */
export function splitIntoSteps(instructions: string): string[] {
  return instructions
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9(])/)
    .map(tidyStep)
    .filter((step) => step.length > 0 && !NOT_A_STEP.test(step))
    .map((step) => (/[.!?]$/.test(step) ? step : `${step}.`));
}

function tidyStep(step: string): string {
  let text = step
    .trim()
    // "1) Add the gin", "2. Stir": the application numbers the steps itself.
    .replace(/^\(?\d{1,2}[.)]\s+/, "")
    .replace(/([!?.])[!?.]+$/, "$1");

  // "DO NOT STIR" reads as shouting.
  if (/[A-Z]{3}/.test(text) && text === text.toUpperCase()) text = text.toLowerCase();

  return capitalize(text);
}
