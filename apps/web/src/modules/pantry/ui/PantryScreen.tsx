import { useSuspenseQuery } from "@tanstack/react-query";
import {
  cocktailsQueryOptions,
  ingredientsQueryOptions,
  ingredientUsage,
  withAncestors,
} from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { useSetPantryIngredient } from "../application/pantry.mutations";
import { pantryQueryOptions } from "../application/pantry.queries";
import { PantryList } from "./PantryList";

/** How many of the most used ingredients are offered first. */
const POPULAR_COUNT = 16;

export function PantryScreen() {
  const { data: ingredients } = useSuspenseQuery(ingredientsQueryOptions());
  const { data: cocktails } = useSuspenseQuery(cocktailsQueryOptions());
  const { data: pantry } = useSuspenseQuery(pantryQueryOptions());
  const setIngredient = useSetPantryIngredient();

  const ownedIds = new Set(pantry);
  // What the bar covers without the user having picked it: whiskey, for bourbon.
  const impliedIds = new Set(
    [...withAncestors(pantry, ingredients)].filter((id) => !ownedIds.has(id)),
  );

  const popularIds = [...ingredientUsage(cocktails)]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, POPULAR_COUNT)
    .map(([id]) => id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-5xl">{m.pantry_title()}</h1>
        <p className="text-ink-muted">{m.pantry_intro()}</p>
      </header>
      <PantryList
        ingredients={ingredients}
        ownedIds={ownedIds}
        impliedIds={impliedIds}
        popularIds={popularIds}
        onToggle={(ingredientId, owned) => setIngredient.mutate({ ingredientId, owned })}
      />
    </div>
  );
}
