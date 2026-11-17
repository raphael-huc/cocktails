import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { type Cocktail, mainIngredientIds } from "../domain/cocktail";

export type CocktailCardProps = {
  cocktail: Cocktail;
  /**
   * When given, a cocktail without description is summed up by its main
   * ingredients, so that cards do not all look alike.
   */
  ingredientNames?: ReadonlyMap<string, string>;
  /** Extra line under the name, such as what is missing to make it. */
  footer?: ReactNode;
  /** Short status shown above the name, such as "Ready to make". */
  badge?: ReactNode;
};

export function CocktailCard({ cocktail, ingredientNames, footer, badge }: CocktailCardProps) {
  const summary =
    cocktail.description ??
    (ingredientNames
      ? mainIngredientIds(cocktail)
          .map((id) => ingredientNames.get(id) ?? id)
          .join(" · ")
      : null);

  return (
    <Link
      to="/cocktails/$cocktailId"
      params={{ cocktailId: cocktail.id }}
      className={[
        "group flex items-start gap-4 rounded-card border border-line bg-surface p-5",
        "border-l-4 transition-colors hover:border-ink-muted",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      ].join(" ")}
      style={cocktail.tint ? { borderLeftColor: cocktail.tint } : undefined}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {badge ? <div>{badge}</div> : null}
        <h3 className="font-display text-2xl">{cocktail.name}</h3>
        {summary ? <p className="line-clamp-2 text-sm text-ink-muted">{summary}</p> : null}
        {footer ? <div className="text-sm text-ink-muted">{footer}</div> : null}
      </div>
      {cocktail.thumbnailUrl ? (
        // Decorative: the name next to it already says what the picture shows.
        // The background holds the place while the picture loads.
        <img
          src={cocktail.thumbnailUrl}
          alt=""
          width={72}
          height={72}
          loading="lazy"
          className="size-18 shrink-0 rounded-card bg-line object-cover"
        />
      ) : null}
    </Link>
  );
}
