import { Button } from "@cocktails/ui";
import type { ReactNode } from "react";
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
  /**
   * What to offer on each missing ingredient, such as adding it to a shopping
   * list. Receives the ingredient and its name.
   */
  groupAction?: (ingredientId: string, name: string) => ReactNode;
};

/** Missing ingredients listed at first: the most useful purchases. */
const GROUPS_PER_PAGE = 10;

export function MatchList({
  listKey,
  makeable,
  almostGroups,
  ingredientNames,
  groupAction,
}: MatchListProps) {
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
            {almostGroups.slice(0, groups.visible).map((group, index) => {
              const name = ingredientNames.get(group.ingredientId) ?? group.ingredientId;

              return (
                <div key={group.ingredientId} className="relative border-b border-line">
                  {/* The first group is the best purchase: show what it unlocks at once. */}
                  <details open={index === 0} className="group">
                    <summary
                      className={[
                        "flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 py-4",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        "[&::-webkit-details-marker]:hidden",
                        // Room for the action, which sits over the right end of the row.
                        groupAction ? "pr-40" : "",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className="text-accent transition-transform group-open:rotate-90"
                      >
                        ›
                      </span>
                      <span className="font-display text-xl">{name}</span>
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
                  {/* Outside the summary: a button inside it would also fold the group. */}
                  {groupAction ? (
                    <div className="absolute top-3 right-0">
                      {groupAction(group.ingredientId, name)}
                    </div>
                  ) : null}
                </div>
              );
            })}
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
