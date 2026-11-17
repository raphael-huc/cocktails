import { Link } from "@tanstack/react-router";
import { CocktailDetail } from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { useCocktailMatches } from "../application/use-cocktail-matches";

/** A cocktail's recipe, showing which of its ingredients the user has. */
export function CocktailScreen({ cocktailId }: { cocktailId: string }) {
  const { matches, ingredientNames, availableIngredientIds } = useCocktailMatches();
  const cocktail = matches.find((match) => match.cocktail.id === cocktailId)?.cocktail;

  return (
    <div className="flex flex-col gap-8">
      <Link to="/cocktails" className="self-start text-sm text-ink-muted hover:text-ink">
        ← {m.cocktail_back()}
      </Link>
      {cocktail ? (
        <CocktailDetail
          cocktail={cocktail}
          ingredientNames={ingredientNames}
          availableIngredientIds={availableIngredientIds}
        />
      ) : (
        <p className="text-ink-muted">{m.cocktail_not_found()}</p>
      )}
    </div>
  );
}
