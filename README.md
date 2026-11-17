# Cocktails

A web application that tells you which cocktails you can make with what you have at home.

You tick the ingredients of your bar; the application lists the cocktails you can make right now, and the ones a single purchase would unlock. What you are missing goes to a shopping list in one tap, and comes back into your bar once bought. Each recipe has its photo, its ingredients with what you own or miss, and a step-by-step mode for the kitchen counter. The interface is available in English and French.

## Requirements

- Node.js 22.18 or later (the import tool runs TypeScript directly with Node)
- pnpm 10
- The Directus backend from the sibling repository `../huc-back`, running on http://localhost:8055

## Getting started

```sh
# 1. Backend, from ../huc-back
docker compose up -d
python scripts/setup-cocktails.py    # collections, permissions, languages
python scripts/seed-cocktails.py     # optional: six classics to start with

# 2. This repository
pnpm install
pnpm import-recipes iba --push            # 77 official IBA cocktails
pnpm import-recipes thecocktaildb --push  # about 600 more, with photos
pnpm dev                                  # http://localhost:5174
```

Accounts are created by hand in the Directus admin, with the **Cocktail App User** role. Sign in with an email and password, or with Google.

The Directus address is set in `apps/web/.env` (`VITE_DIRECTUS_URL`). Directus must allow the application's origin: `http://localhost:5174` in `CORS_ORIGIN`, and `http://localhost:5174/auth/callback` in `AUTH_GOOGLE_REDIRECT_ALLOW_LIST`.

## Commands

Run from the repository root.

| Command                                         | What it does                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                                      | Application on http://localhost:5174                                           |
| `pnpm build`                                    | Production build of the application                                            |
| `pnpm check`                                    | Lint, typecheck, architecture rules and tests: run it after any change         |
| `pnpm format`                                   | Apply formatting and safe lint fixes                                           |
| `pnpm storybook`                                | Component library on http://localhost:6007                                     |
| `pnpm storybook:web`                            | Application components on http://localhost:6008                                |
| `pnpm import-recipes <source>`                  | Dry run of an import (`iba`, `thecocktaildb`): prints a report, writes nothing |
| `pnpm import-recipes <source> --push`           | Write ingredients, cocktails and photos to Directus                            |
| `pnpm import-recipes <source> --push --refresh` | Also rewrite the recipes already imported from that source                     |
| `pnpm import-recipes sync-ingredients`          | Apply the ingredient catalog: names, hierarchy, merges                         |
| `pnpm import-recipes warm-photos`               | Make Directus generate every image size in advance                             |

## Layout

```
apps/web        the application: React 19, Vite, TanStack Router and Query, Tailwind 4, Paraglide
packages/ui     generic component library with its Storybook, consumed as source
tools/import    command-line tool that imports recipes into Directus
```

The application is organised by business domain. Each module in `apps/web/src/modules` has the same layers, and the dependencies between them are checked by `pnpm arch`:

| Layer          | Contains                                         |
| -------------- | ------------------------------------------------ |
| `domain/`      | Types and rules in plain TypeScript, unit-tested |
| `http/`        | The only code that talks to Directus             |
| `application/` | Queries, mutations and cache handling            |
| `ui/`          | React components                                 |

| Module        | Role                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| `auth`        | Session, sign in, account language                                               |
| `catalog`     | Cocktails and ingredients, and the components that display them                  |
| `pantry`      | The user's bar                                                                   |
| `matching`    | The catalog compared with the bar: what can be made, what is one ingredient away |
| `preparation` | Step-by-step mode                                                                |
| `shopping`    | Shopping list: missing ingredients and anything else to buy                      |

## How matching works

A cocktail is makeable when the bar covers every required ingredient. Garnishes and optional ingredients never block a cocktail.

Ingredients form a hierarchy: owning a specific ingredient covers the more generic one. Bourbon counts as whiskey, a lemon covers lemon juice, sugar covers simple syrup. The reverse is not true: a recipe that asks for bourbon is not satisfied by any whiskey.

## Recipes and ingredients

Recipes come from two public sources: the official cocktails of the International Bartenders Association and [TheCocktailDB](https://www.thecocktaildb.com), which also provides the photos. TheCocktailDB is queried with its public test key, intended for development and personal use.

`tools/import/src/catalog/ingredients.ts` is the reference for ingredients: their English and French names, their category, their hierarchy, and every spelling the sources use for them. A recipe using an ingredient the catalog does not know is imported as a draft and stays out of the application until it is fixed.

Recipe texts (steps, descriptions) and cocktail names exist in English only; ingredient names and the interface are translated.

## More

`CLAUDE.md` holds the detailed conventions: architecture rules, copy and translations, styling tokens, and how to add a language or a recipe source.
