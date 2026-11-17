import { TextField, ToggleChip } from "@cocktails/ui";
import { m } from "@/shared/i18n";
import type { CocktailCategory, CocktailFilter } from "../domain/cocktail";
import { categoryLabel } from "./labels";

export type CocktailFiltersProps = {
  filter: CocktailFilter;
  onChange: (filter: CocktailFilter) => void;
  /** Categories to offer, usually only the ones that have cocktails. */
  categories: readonly CocktailCategory[];
  /** Whether to offer the search by name. */
  search?: boolean;
};

export function CocktailFilters({
  filter,
  onChange,
  categories,
  search = false,
}: CocktailFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {search ? (
        <TextField
          label={m.catalog_search()}
          type="search"
          value={filter.search}
          onChange={(event) => onChange({ ...filter, search: event.target.value })}
          className="max-w-sm"
        />
      ) : null}

      {/*
        On a narrow screen the chips stay on one line and scroll sideways.
        `min-w-0` matters: a fieldset otherwise refuses to be narrower than its content.
      */}
      <fieldset className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        <legend className="sr-only">{m.category_filter_label()}</legend>
        <ToggleChip
          pressed={filter.classicsOnly}
          onPressedChange={(classicsOnly) => onChange({ ...filter, classicsOnly })}
        >
          {m.filter_classics()}
        </ToggleChip>
        {/* A single category leaves nothing to choose. */}
        {categories.length > 1 ? (
          <>
            <span aria-hidden="true" className="mx-1 w-px shrink-0 self-stretch bg-line" />
            <ToggleChip
              pressed={filter.category === null}
              onPressedChange={() => onChange({ ...filter, category: null })}
            >
              {m.category_all()}
            </ToggleChip>
            {categories.map((category) => (
              <ToggleChip
                key={category}
                pressed={filter.category === category}
                onPressedChange={(pressed) =>
                  onChange({ ...filter, category: pressed ? category : null })
                }
              >
                {categoryLabel(category)}
              </ToggleChip>
            ))}
          </>
        ) : null}
      </fieldset>
    </div>
  );
}
