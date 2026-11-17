import { Button, buttonStyles } from "@cocktails/ui";
import { Link } from "@tanstack/react-router";
import { type Cocktail, IngredientList } from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { preparationStages } from "../domain/preparation";

export type PreparationViewProps = {
  cocktail: Cocktail;
  ingredientNames: ReadonlyMap<string, string>;
  /** Position in the stages: 0 is the ingredients, then one per step. */
  stageIndex: number;
  onStageChange: (stageIndex: number) => void;
};

/**
 * One stage of a recipe at a time, with large text and large buttons: it is
 * read at arm's length and tapped with busy hands.
 */
export function PreparationView({
  cocktail,
  ingredientNames,
  stageIndex,
  onStageChange,
}: PreparationViewProps) {
  const stages = preparationStages(cocktail);
  const lastIndex = stages.length - 1;
  const index = Math.min(Math.max(stageIndex, 0), lastIndex);
  const stage = stages[index];
  const stepCount = cocktail.steps.length;

  return (
    <div className="flex min-h-[70dvh] flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          to="/cocktails/$cocktailId"
          params={{ cocktailId: cocktail.id }}
          className="self-start text-sm text-ink-muted hover:text-ink"
        >
          ← {m.prep_exit()}
        </Link>
        <p className="font-display text-2xl text-ink-muted">{cocktail.name}</p>
      </header>

      {/* Announced on change, so a screen reader follows the steps too. */}
      <section aria-live="polite" className="flex flex-1 flex-col justify-center gap-6">
        {stage?.kind === "step" ? (
          <>
            <p className="text-accent tabular-nums">
              {m.prep_step({ current: stage.number, total: stepCount })}
            </p>
            <p className="font-display text-4xl leading-tight sm:text-5xl">{stage.text}</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl sm:text-5xl">{m.prep_gather()}</h1>
            <IngredientList
              lines={cocktail.ingredients}
              ingredientNames={ingredientNames}
              size="lg"
            />
          </>
        )}
      </section>

      <nav className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="h-16 flex-1 text-lg"
          disabled={index === 0}
          onClick={() => onStageChange(index - 1)}
        >
          {m.prep_previous()}
        </Button>
        {index < lastIndex ? (
          <Button
            size="lg"
            className="h-16 flex-1 text-lg"
            onClick={() => onStageChange(index + 1)}
          >
            {index === 0 ? m.prep_start() : m.prep_next()}
          </Button>
        ) : (
          <Link
            to="/cocktails/$cocktailId"
            params={{ cocktailId: cocktail.id }}
            className={buttonStyles({ size: "lg", className: "h-16 flex-1 text-lg" })}
          >
            {m.prep_done()}
          </Link>
        )}
      </nav>
    </div>
  );
}
