# CLAUDE.md

Cocktail application: suggests the cocktails a user can make from the ingredients they have at home. pnpm monorepo, backed by the Directus instance in the sibling repo `../huc-back`.

## Layout

- `apps/web` — the application: React 19, Vite, TypeScript, Tailwind 4, TanStack Router and Query, Paraglide.
- `packages/ui` — generic component library with its Storybook. Consumed as source, no build step.
- `tools/import` — command-line tool that fetches recipes from public sources, normalizes them and writes them to Directus. Plain TypeScript run directly by Node, no build step.

## Commands

Run from the repository root. Use **pnpm** only.

```sh
pnpm dev          # application on http://localhost:5174
pnpm storybook    # component library on http://localhost:6007
pnpm storybook:web  # module components of the application on http://localhost:6008
pnpm check        # lint + typecheck + architecture rules + tests: run after any change
pnpm format       # apply Biome formatting and safe fixes

pnpm import-recipes iba          # dry run: fetch, normalize, print a report (sources: iba, thecocktaildb)
pnpm import-recipes iba --push   # write ingredients, cocktails and photos to Directus
pnpm import-recipes iba --push --refresh   # also rewrite recipes already imported from that source
pnpm import-recipes sync-ingredients       # names (EN/FR), hierarchy and merges of ingredients
```

`pnpm check` is the definition of "nothing is broken". Its parts also run alone: `pnpm lint`, `pnpm typecheck`, `pnpm arch`, `pnpm test`.

## Architecture of `apps/web/src`

```
app/        bootstrap, router, layout, routes (thin: read URL params, render a screen)
modules/    one folder per business domain
shared/     technical code with no business knowledge (http client, i18n, errors)
```

Every module has the same layers:

| Layer          | Contains                                                             | May import                                                                 |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `domain/`      | types and rules, plain TypeScript, unit-tested                       | `domain/` of any module, nothing else                                      |
| `http/`        | DTOs (zod), mappers, repositories: the only code that knows Directus | own `domain/`, `shared/`                                                   |
| `application/` | query options, mutations, cache handling                             | `domain/`, `http/`, `shared/`                                              |
| `ui/`          | React components                                                     | `application/`, `domain/`, `@cocktails/ui`, `shared/i18n`, `shared/errors` |
| `index.ts`     | public API of the module                                             | —                                                                          |

Rules, enforced by `pnpm arch` (`apps/web/.dependency-cruiser.cjs`):

- Code outside a module imports it through its `index.ts` only. The one exception is `domain/` importing another module's `domain/` directly.
- `ui/` never imports `http/`; it goes through `application/`.
- `http/` always returns domain types and throws `AppError` (`shared/errors`), never raw Directus shapes or errors.
- In `ui/`, split components that only take props (`CocktailCard`) from screens wired to `application/` (`…Screen`).

The modules and what depends on what (never the other way round):

- `auth` — session, sign in, sign out.
- `catalog` — cocktails and ingredients: data, rules, and the components that display them (`CocktailCard`, `CocktailDetail`, `CocktailFilters`, `IngredientList`). It knows nothing of the user's bar.
- `pantry` — the user's bar. Depends on `catalog`.
- `matching` — the catalog compared with the bar. Depends on `catalog` and `pantry`, and therefore owns every screen that needs both: what can be made, the catalog with its "ready" marks, a cocktail's page.
- `preparation` — the step-by-step mode. Depends on `catalog`.

Lists of cocktails are filtered through the URL (`app/cocktail-filter-search.ts`) and unfolded a page at a time (`shared/ui/use-show-more.ts`); do not render the whole catalog at once.

## Conventions

- **User-facing copy is written in English and translated into French**, and always goes through Paraglide. English is the source language: add the key to `apps/web/messages/en.json`, add its translation to `messages/fr.json` in the same change (a test fails when the two files differ in keys or parameters), and use `m.key()` from `@/shared/i18n`. No hard-coded strings in components.
- **The language is chosen per account.** It starts from the browser's language, and once a user picks one it is saved on their Directus user (`language`) and wins on every device (`modules/auth/application/account-language.ts`). Changing language reloads the page. Ingredient names follow it through Directus translations; recipes (steps, descriptions, line notes) and cocktail names exist in English only.
- **To add a language**: add it to `apps/web/project.inlang/settings.json`, create its `messages/<locale>.json`, describe it in `shared/i18n/index.ts` (the compiler asks for it), and declare it in `../huc-back/scripts/setup-cocktails.py` and in the import tool's catalog for ingredient names.
- **`packages/ui` contains no text and no business knowledge**: labels come in through props. A component that knows what a cocktail is belongs in a module's `ui/`.
- **Styling uses the tokens** declared in `packages/ui/src/tokens/tokens.css` (`bg-surface`, `text-ink-muted`, `rounded-control`…), never raw colours. The application's values are in `apps/web/src/app/styles/index.css`.
- Every `packages/ui` component has a `.stories.tsx` next to it.
- Every props-only component of a module's `ui/` has a `.stories.tsx` next to it too, shown by the Storybook of `apps/web` (`apps/web/.storybook`). Stories follow the same import rules as `ui/`; the router, the query cache and the mock of the auth repository are set up once in `.storybook/preview.tsx`. Screens have no stories.
- `apps/web/src/shared/http/schema.ts` is a hand-written mirror of the data model created by `../huc-back/scripts/setup-cocktails.py`. Change both together.
- Cocktail images are requested in the sizes declared as presets in `../huc-back/scripts/setup-cocktails.py` (`shared/http/assets.ts`), never with free dimensions: the import tool generates those files ahead of time (`pnpm import-recipes warm-photos`).
- Generated code is not committed: `src/app/routeTree.gen.ts` and `src/shared/i18n/paraglide/`. `pnpm typecheck`, `pnpm dev` and `pnpm build` regenerate them.
- TypeScript stays on 6.x: dependency-cruiser cannot read sources with TypeScript 7.0.

## Importing recipes

`tools/import` turns each source into the same `Recipe` shape (`src/normalize/recipe.ts`), then pushes it.

- `src/catalog/ingredients.ts` is the canonical list of ingredients with the names each one goes by in the sources. An unknown name is reported by the dry run: add it there as an entry or an alias. Never create ingredients by another path.
- A recipe that could not be read completely is created as a **draft**; the application only shows published cocktails.
- The push never modifies a cocktail or an ingredient that already exists, so corrections made in the Directus admin survive a new import.
- `--refresh` is the exception, and how a better normalisation reaches recipes already imported: it rewrites the lines, steps, category and glass of the cocktails that came from that source. Name, status, description, tint and photo are never touched.
- Ingredients are named and organised in the catalog, not in the Directus admin: English and French names, category, `parent` (what the ingredient can stand in for), `replaces` (former ingredients merged into it). `sync-ingredients` applies it and overwrites what was changed by hand.
- Downloads and reports are cached in `tools/import/.cache/` (not committed). Delete it to fetch fresh data.
- To add a source: a file in `src/sources/` that returns `Recipe[]`, registered in `src/cli.ts`.

## Backend

Directus runs from `../huc-back` (`docker compose up -d`, http://localhost:8055). Authentication uses Directus session cookies; accounts are created by hand in the Directus admin. To debug API calls, read the logs with `docker compose logs --tail=200 directus` from `../huc-back`.
