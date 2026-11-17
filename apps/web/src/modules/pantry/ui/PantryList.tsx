import { TextField, ToggleChip } from "@cocktails/ui";
import { useState } from "react";
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory } from "@/modules/catalog";
import { m } from "@/shared/i18n";

export type PantryListProps = {
  ingredients: readonly Ingredient[];
  ownedIds: ReadonlySet<string>;
  /**
   * Ingredients the user did not pick but that something they own covers:
   * whiskey when they have bourbon. Shown outlined.
   */
  impliedIds?: ReadonlySet<string>;
  /** Ingredients to offer first, most useful first. */
  popularIds?: readonly string[];
  onToggle: (ingredientId: string, owned: boolean) => void;
};

const CATEGORY_LABELS: Record<IngredientCategory, () => string> = {
  spirit: m.category_spirit,
  liqueur: m.category_liqueur,
  fortified_wine: m.category_fortified_wine,
  bitters: m.category_bitters,
  juice: m.category_juice,
  syrup: m.category_syrup,
  mixer: m.category_mixer,
  fresh: m.category_fresh,
  other: m.category_other,
};

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function PantryList({
  ingredients,
  ownedIds,
  impliedIds,
  popularIds = [],
  onToggle,
}: PantryListProps) {
  const [search, setSearch] = useState("");

  if (ingredients.length === 0) {
    return <p className="text-ink-muted">{m.pantry_empty()}</p>;
  }

  const wanted = fold(search.trim());
  const matching = ingredients.filter((ingredient) => fold(ingredient.name).includes(wanted));

  const groups = INGREDIENT_CATEGORIES.map((category) => ({
    key: category as string,
    title: CATEGORY_LABELS[category](),
    ingredients: matching
      .filter((ingredient) => ingredient.category === category)
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.ingredients.length > 0);

  // While searching, the categories alone are easier to scan.
  const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const popular = wanted
    ? []
    : popularIds.flatMap((id) => {
        const ingredient = byId.get(id);
        return ingredient ? [ingredient] : [];
      });
  if (popular.length > 0) {
    groups.unshift({ key: "popular", title: m.pantry_popular(), ingredients: popular });
  }

  const showsImplied = matching.some((ingredient) => impliedIds?.has(ingredient.id));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <TextField
          label={m.pantry_search()}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full max-w-sm"
        />
        <p className="pb-2.5 text-ink-muted tabular-nums" aria-live="polite">
          {m.pantry_selected({ count: ownedIds.size })}
        </p>
      </div>

      {showsImplied ? <p className="text-sm text-ink-muted">{m.pantry_implied_hint()}</p> : null}
      {groups.length === 0 ? <p className="text-ink-muted">{m.pantry_no_result()}</p> : null}

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <h2 className="font-display text-2xl">{group.title}</h2>
          <div className="flex flex-wrap gap-2">
            {group.ingredients.map((ingredient) => (
              <ToggleChip
                key={ingredient.id}
                pressed={ownedIds.has(ingredient.id)}
                outlined={impliedIds?.has(ingredient.id)}
                onPressedChange={(owned) => onToggle(ingredient.id, owned)}
              >
                {ingredient.name}
              </ToggleChip>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
