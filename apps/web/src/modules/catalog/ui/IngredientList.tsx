import { Badge } from "@cocktails/ui";
import { m } from "@/shared/i18n";
import type { CocktailIngredient } from "../domain/cocktail";

export type IngredientListProps = {
  lines: readonly CocktailIngredient[];
  ingredientNames: ReadonlyMap<string, string>;
  /**
   * What the user can count on: the ingredients of their bar and the generic
   * ones those cover. When given, each line says whether it is available.
   */
  availableIngredientIds?: ReadonlySet<string>;
  /** Larger text, for reading at arm's length while preparing. */
  size?: "md" | "lg";
};

function formatAmount({ amount, unit }: CocktailIngredient): string | null {
  if (amount === null) return null;
  if (unit === "ml") return m.unit_ml({ amount });
  if (unit === "dash") {
    return amount === 1 ? m.unit_dash_one({ amount }) : m.unit_dash_other({ amount });
  }
  return String(amount);
}

/** The lines of a recipe: measure, ingredient, and what kind of line it is. */
export function IngredientList({
  lines,
  ingredientNames,
  availableIngredientIds,
  size = "md",
}: IngredientListProps) {
  return (
    <ul
      className={`flex flex-col divide-y divide-line border-y border-line ${size === "lg" ? "text-xl" : ""}`}
    >
      {lines.map((line, index) => {
        const available = availableIngredientIds?.has(line.ingredientId);
        // Only a required ingredient is worth flagging as missing.
        const missing = available === false && !line.optional && !line.garnish;

        return (
          // A recipe can use the same ingredient twice (in the drink and as a
          // garnish), and its lines are never reordered once displayed.
          // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity
          <li key={index} className="flex items-baseline gap-3 py-3">
            <span
              className={`shrink-0 text-ink-muted tabular-nums ${size === "lg" ? "w-28" : "w-24"}`}
            >
              {formatAmount(line)}
            </span>
            <span className={`flex-1 ${missing ? "text-ink-muted" : ""}`}>
              {line.note ?? ingredientNames.get(line.ingredientId) ?? line.ingredientId}
            </span>
            {line.garnish ? <Badge>{m.cocktail_garnish()}</Badge> : null}
            {line.optional ? <Badge>{m.cocktail_optional()}</Badge> : null}
            {missing ? <Badge tone="danger">{m.cocktail_missing()}</Badge> : null}
            {available ? (
              <span className="text-accent" role="img" aria-label={m.cocktail_in_bar()}>
                ✓
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
