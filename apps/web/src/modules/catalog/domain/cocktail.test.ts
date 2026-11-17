import { describe, expect, it } from "vitest";
import {
  type Cocktail,
  type CocktailIngredient,
  categoriesOf,
  ingredientUsage,
  mainIngredientIds,
  matchesFilter,
  NO_FILTER,
} from "./cocktail";

function line(ingredientId: string, flags: Partial<CocktailIngredient> = {}): CocktailIngredient {
  return {
    ingredientId,
    amount: 30,
    unit: "ml",
    optional: false,
    garnish: false,
    note: null,
    ...flags,
  };
}

function cocktail(name: string, overrides: Partial<Cocktail> = {}): Cocktail {
  return {
    id: name,
    name,
    category: "cocktail",
    classic: false,
    description: null,
    glass: null,
    tint: null,
    imageUrl: null,
    thumbnailUrl: null,
    ingredients: [],
    steps: [],
    ...overrides,
  };
}

describe("matchesFilter", () => {
  const pinaColada = cocktail("Piña Colada", { category: "cocktail", classic: true });
  const jelloShot = cocktail("Jello Shot", { category: "shot" });

  it("lets everything through without a filter", () => {
    expect(matchesFilter(pinaColada, NO_FILTER)).toBe(true);
    expect(matchesFilter(jelloShot, NO_FILTER)).toBe(true);
  });

  it("searches the name without minding case or accents", () => {
    expect(matchesFilter(pinaColada, { ...NO_FILTER, search: " pina col " })).toBe(true);
    expect(matchesFilter(pinaColada, { ...NO_FILTER, search: "shot" })).toBe(false);
  });

  it("filters by category and by classics", () => {
    expect(matchesFilter(jelloShot, { ...NO_FILTER, category: "shot" })).toBe(true);
    expect(matchesFilter(pinaColada, { ...NO_FILTER, category: "shot" })).toBe(false);
    expect(matchesFilter(pinaColada, { ...NO_FILTER, classicsOnly: true })).toBe(true);
    expect(matchesFilter(jelloShot, { ...NO_FILTER, classicsOnly: true })).toBe(false);
  });

  it("requires every criterion at once", () => {
    const filter = { category: "cocktail", classicsOnly: true, search: "jello" } as const;

    expect(matchesFilter(pinaColada, filter)).toBe(false);
  });
});

describe("mainIngredientIds", () => {
  it("keeps the first required ingredients, once each", () => {
    const mojito = cocktail("Mojito", {
      ingredients: [
        line("white-rum"),
        line("lime-juice"),
        line("mint"),
        line("soda-water", { optional: true }),
        line("sugar"),
        line("mint", { garnish: true }),
        line("ice"),
      ],
    });

    expect(mainIngredientIds(mojito)).toEqual(["white-rum", "lime-juice", "mint", "sugar"]);
    expect(mainIngredientIds(mojito, 2)).toEqual(["white-rum", "lime-juice"]);
  });
});

describe("ingredientUsage", () => {
  it("counts each cocktail once per required ingredient", () => {
    const usage = ingredientUsage([
      cocktail("A", {
        ingredients: [line("gin"), line("gin"), line("lime"), line("mint", { garnish: true })],
      }),
      cocktail("B", { ingredients: [line("gin")] }),
    ]);

    expect(usage.get("gin")).toBe(2);
    expect(usage.get("lime")).toBe(1);
    expect(usage.has("mint")).toBe(false);
  });
});

describe("categoriesOf", () => {
  it("lists the categories present, in display order", () => {
    const cocktails = [cocktail("A", { category: "punch" }), cocktail("B", { category: "shot" })];

    expect(categoriesOf(cocktails)).toEqual(["shot", "punch"]);
  });
});
