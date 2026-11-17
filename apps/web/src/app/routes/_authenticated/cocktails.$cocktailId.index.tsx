import { createFileRoute } from "@tanstack/react-router";
import { CocktailDetailSkeleton } from "@/modules/catalog";
import { CocktailScreen } from "@/modules/matching";

export const Route = createFileRoute("/_authenticated/cocktails/$cocktailId/")({
  component: CocktailRoute,
  pendingComponent: CocktailDetailSkeleton,
});

function CocktailRoute() {
  const { cocktailId } = Route.useParams();
  return <CocktailScreen cocktailId={cocktailId} />;
}
