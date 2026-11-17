import { Button } from "@cocktails/ui";
import { CocktailGrid, cocktailCountLabel } from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { useShowMore } from "@/shared/ui/use-show-more";
import type { CocktailMatch, MissingIngredientGroup } from "../domain/matching";

export type MatchListProps = {
  /** Identifies the list and its filter, see `CocktailGrid`. */
  listKey: string;
  makeable: readonly CocktailMatch[];
  /** Cocktails one ingredient away, grouped by that ingredient. */
  almostGroups: readonly MissingIngredientGroup[];
  ingredientNames: ReadonlyMap<string, string>;
};

/** Missing ingredients listed at first: the most useful purchases. */
const GROUPS_PER_PAGE = 10;

export function MatchList({ listKey, makeable, almostGroups, ingredientNames }: MatchListProps) {
  const groups = useShowMore(`${listKey}/groups`, almostGroups.length, GROUPS_PER_PAGE);

  if (makeable.length === 0 && almostGroups.length === 0) {
    return <p className="text-ink-muted">{m.matches_empty()}</p>;
  }

  return (
    <div className="flex flex-col gap-12">
      {makeable.length > 0 ? (
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-3xl">{m.matches_makeable_title()}</h2>
          <CocktailGrid
            key={`${listKey}/makeable`}
            listKey={`${listKey}/makeable`}
            items={makeable}
            ingredientNames={ingredientNames}
          />
        </section>
      ) : null}

      {almostGroups.length > 0 ? (
        <section className="flex flex-col gap-5">
          <header className="flex flex-col gap-2">
            <h2 className="font-display text-3xl">{m.matches_almost_title()}</h2>
            <p className="text-ink-muted">{m.matches_almost_intro()}</p>
          </header>
          <div className="flex flex-col border-t border-line">
            {almostGroups.slice(0, groups.visible).map((group, index) => (
              // The first group is the best purchase: show what it unlocks at once.
              <details
                key={group.ingredientId}
                open={index === 0}
                className="group border-b border-line"
              >
                <summary
                  className={[
                    "flex cursor-pointer list-none items-baseline gap-3 py-4",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    "[&::-webkit-details-marker]:hidden",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="text-accent transition-transform group-open:rotate-90"
                  >
                    ›
                  </span>
                  <span className="flex-1 font-display text-xl">
                    {ingredientNames.get(group.ingredientId) ?? group.ingredientId}
                  </span>
                  <span className="text-sm text-ink-muted tabular-nums">
                    {cocktailCountLabel(group.matches.length)}
                  </span>
                </summary>
                <div className="pb-6">
                  <CocktailGrid
                    key={`${listKey}/${group.ingredientId}`}
                    listKey={`${listKey}/${group.ingredientId}`}
                    items={group.matches}
                    ingredientNames={ingredientNames}
                  />
                </div>
              </details>
            ))}
          </div>
          {groups.remaining > 0 ? (
            <Button variant="secondary" className="self-center" onClick={groups.showMore}>
              {m.list_show_more({ count: groups.nextPage })}
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
