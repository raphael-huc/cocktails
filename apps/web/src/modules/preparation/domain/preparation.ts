import type { Cocktail } from "@/modules/catalog/domain/cocktail";

/** One screen of the step-by-step mode. */
export type Stage =
  /** Before starting: everything to put on the counter. */
  { kind: "ingredients" } | { kind: "step"; number: number; text: string };

/** The screens to go through to make a cocktail: its ingredients, then each step. */
export function preparationStages(cocktail: Cocktail): Stage[] {
  return [
    { kind: "ingredients" },
    ...cocktail.steps.map((text, index): Stage => ({ kind: "step", number: index + 1, text })),
  ];
}
