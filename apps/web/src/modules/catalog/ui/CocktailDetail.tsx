import { Badge, buttonStyles } from "@cocktails/ui";
import { Link } from "@tanstack/react-router";
import { m } from "@/shared/i18n";
import type { Cocktail } from "../domain/cocktail";
import { IngredientList } from "./IngredientList";
import { categoryLabel, glassLabel } from "./labels";

export type CocktailDetailProps = {
  cocktail: Cocktail;
  ingredientNames: ReadonlyMap<string, string>;
  /**
   * The ingredients of the user's bar and the generic ones those cover. When
   * given, the recipe shows what is available and what is missing.
   */
  availableIngredientIds?: ReadonlySet<string>;
};

export function CocktailDetail({
  cocktail,
  ingredientNames,
  availableIngredientIds,
}: CocktailDetailProps) {
  return (
    <article className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        {cocktail.imageUrl ? (
          <img
            src={cocktail.imageUrl}
            alt={m.cocktail_photo_alt({ name: cocktail.name })}
            width={320}
            height={320}
            className="aspect-square w-full rounded-card bg-line object-cover sm:w-56"
          />
        ) : null}
        <div
          className="flex flex-1 flex-col gap-4 border-l-4 border-line pl-5"
          style={cocktail.tint ? { borderLeftColor: cocktail.tint } : undefined}
        >
          <h1 className="font-display text-5xl">{cocktail.name}</h1>
          <div className="flex flex-wrap gap-2">
            {cocktail.classic ? <Badge tone="accent">{m.cocktail_classic()}</Badge> : null}
            <Badge>{categoryLabel(cocktail.category)}</Badge>
            {cocktail.glass ? <Badge>{glassLabel(cocktail.glass)}</Badge> : null}
          </div>
          {cocktail.description ? (
            <p className="max-w-prose text-ink-muted">{cocktail.description}</p>
          ) : null}
          {cocktail.steps.length > 0 ? (
            <Link
              to="/cocktails/$cocktailId/make"
              params={{ cocktailId: cocktail.id }}
              className={buttonStyles({ size: "lg", className: "self-start" })}
            >
              {m.cocktail_start_making()}
            </Link>
          ) : null}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl">{m.cocktail_ingredients()}</h2>
        <IngredientList
          lines={cocktail.ingredients}
          ingredientNames={ingredientNames}
          availableIngredientIds={availableIngredientIds}
        />
      </section>

      {cocktail.steps.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl">{m.cocktail_steps()}</h2>
          <ol className="flex flex-col gap-4">
            {cocktail.steps.map((step, index) => (
              // Steps are an ordered list with no identity of their own.
              // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity
              <li key={index} className="flex gap-4">
                <span className="font-display text-2xl text-accent tabular-nums">{index + 1}</span>
                <p className="max-w-prose pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}
