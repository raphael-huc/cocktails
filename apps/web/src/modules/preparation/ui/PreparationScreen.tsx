import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { cocktailsQueryOptions, ingredientNames, ingredientsQueryOptions } from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { PreparationView } from "./PreparationView";
import { useWakeLock } from "./use-wake-lock";

/** The step-by-step mode of a cocktail: screen kept on, arrow keys to move. */
export function PreparationScreen({ cocktailId }: { cocktailId: string }) {
  const { data: cocktails } = useSuspenseQuery(cocktailsQueryOptions());
  const { data: ingredients } = useSuspenseQuery(ingredientsQueryOptions());
  const cocktail = cocktails.find((candidate) => candidate.id === cocktailId);
  const stepCount = cocktail?.steps.length ?? 0;

  const [stageIndex, setStageIndex] = useState(0);
  useWakeLock();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setStageIndex((index) => Math.min(index + 1, stepCount));
      if (event.key === "ArrowLeft") setStageIndex((index) => Math.max(index - 1, 0));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stepCount]);

  if (!cocktail) return <p className="text-ink-muted">{m.cocktail_not_found()}</p>;

  return (
    <PreparationView
      cocktail={cocktail}
      ingredientNames={ingredientNames(ingredients)}
      stageIndex={stageIndex}
      onStageChange={setStageIndex}
    />
  );
}
