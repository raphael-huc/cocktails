import { createFileRoute } from "@tanstack/react-router";
import { PreparationScreen } from "@/modules/preparation";

export const Route = createFileRoute("/_authenticated/cocktails/$cocktailId/make")({
  component: PreparationRoute,
});

function PreparationRoute() {
  const { cocktailId } = Route.useParams();
  // A new cocktail starts again from its ingredients.
  return <PreparationScreen key={cocktailId} cocktailId={cocktailId} />;
}
