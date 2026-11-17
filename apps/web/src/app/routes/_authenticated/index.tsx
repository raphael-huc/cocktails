import { createFileRoute } from "@tanstack/react-router";
import { CocktailListSkeleton } from "@/modules/catalog";
import { MatchesScreen } from "@/modules/matching";
import {
  cocktailFilterSearchSchema,
  toCocktailFilter,
  toCocktailFilterSearch,
} from "../../cocktail-filter-search";

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: (search) => cocktailFilterSearchSchema.parse(search),
  component: MatchesRoute,
  pendingComponent: CocktailListSkeleton,
});

function MatchesRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <MatchesScreen
      filter={toCocktailFilter(search)}
      onFilterChange={(filter) =>
        void navigate({ search: toCocktailFilterSearch(filter), replace: true })
      }
    />
  );
}
