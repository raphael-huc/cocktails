import { createFileRoute } from "@tanstack/react-router";
import { CocktailListSkeleton } from "@/modules/catalog";
import { BrowseScreen } from "@/modules/matching";
import {
  cocktailFilterSearchSchema,
  toCocktailFilter,
  toCocktailFilterSearch,
} from "../../cocktail-filter-search";

export const Route = createFileRoute("/_authenticated/cocktails/")({
  validateSearch: (search) => cocktailFilterSearchSchema.parse(search),
  component: BrowseRoute,
  pendingComponent: () => <CocktailListSkeleton withHeading />,
});

function BrowseRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <BrowseScreen
      filter={toCocktailFilter(search)}
      onFilterChange={(filter) =>
        void navigate({ search: toCocktailFilterSearch(filter), replace: true })
      }
    />
  );
}
