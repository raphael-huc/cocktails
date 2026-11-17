import { describe, expect, it } from "vitest";
import { createIngredientResolver } from "../catalog/resolve.ts";
import { buildLine, normalizeTheCocktailDbDrink } from "./thecocktaildb.ts";

const resolver = createIngredientResolver();

function drink(columns: Record<string, string | null>) {
  return {
    idDrink: "11007",
    strDrink: "Margarita",
    strCategory: "Ordinary Drink",
    strGlass: "Cocktail glass",
    strInstructions: "Shake with ice. Strain into the glass.",
    strDrinkThumb: "https://example.test/margarita.jpg",
    ...columns,
  };
}

describe("normalizeTheCocktailDbDrink", () => {
  const margarita = normalizeTheCocktailDbDrink(
    drink({
      strIngredient1: "Tequila",
      strMeasure1: "1 1/2 oz ",
      strIngredient2: "Lime juice",
      strMeasure2: "1 oz ",
      strIngredient3: "Salt",
      strMeasure3: null,
      strIngredient4: "",
      strMeasure4: "",
    }),
    resolver,
  );

  it("identifies the recipe and maps its category and glass", () => {
    expect(margarita).toMatchObject({
      source: "thecocktaildb",
      sourceId: "11007",
      name: "Margarita",
      category: "cocktail",
      glass: "martini",
      photoUrl: "https://example.test/margarita.jpg",
      issues: [],
    });
    expect(margarita.steps).toHaveLength(2);
  });

  it("converts measures and stops at the first empty column", () => {
    expect(margarita.lines).toEqual([
      expect.objectContaining({ ingredientSlug: "tequila", amount: 45, unit: "ml", note: null }),
      expect.objectContaining({ ingredientSlug: "lime-juice", amount: 30, unit: "ml" }),
      expect.objectContaining({ ingredientSlug: "salt", amount: null, unit: null, note: null }),
    ]);
  });

  it("keeps the wording of a measure it cannot convert", () => {
    expect(buildLine("Orange juice", "2 parts", resolver)).toMatchObject({
      ingredientSlug: "orange-juice",
      amount: null,
      unit: null,
      note: "2 parts Orange juice",
    });
  });

  it("reads the juice of a fruit as juice, not as a piece of fruit", () => {
    expect(buildLine("Lime", "Juice of 1", resolver)).toMatchObject({
      ingredientSlug: "lime-juice",
      garnish: false,
      note: "Juice of 1 Lime",
    });
    // Even when the source speaks of a wedge.
    expect(buildLine("Lemon", "Juice of 1 wedge", resolver)).toMatchObject({
      ingredientSlug: "lemon-juice",
      garnish: false,
    });
  });

  it.each([
    ["Lemon peel", "1 twist of", "lemon", "1 twist of Lemon peel"],
    ["Orange", "1 slice", "orange", "1 slice Orange"],
    ["Lime", "Wedge", "lime", "Wedge Lime"],
    ["Sugar", "Around rim put 1 pinch", "sugar", "Around rim put 1 pinch Sugar"],
    ["Orange spiral", "", "orange", "Orange spiral"],
  ])("recognises %s (%s) as a garnish", (name, measure, slug, note) => {
    expect(buildLine(name, measure, resolver)).toMatchObject({
      ingredientSlug: slug,
      garnish: true,
      note,
    });
  });

  it("does not repeat in words what the garnish badge already says", () => {
    expect(buildLine("Lemon", "Garnish with", resolver)).toMatchObject({
      garnish: true,
      note: null,
    });
    expect(buildLine("Mint", "Garnish with a sprig of", resolver)).toMatchObject({
      garnish: true,
      note: "A sprig of Mint",
    });
  });

  it("treats a cherry or an olive without a volume as a garnish", () => {
    expect(buildLine("Maraschino cherry", "1", resolver)).toMatchObject({ garnish: true });
    expect(buildLine("Olive", "", resolver)).toMatchObject({ garnish: true, note: null });
    expect(buildLine("Maraschino cherry", "1 oz", resolver)).toMatchObject({ garnish: false });
  });

  it("sets remarks in brackets aside", () => {
    expect(buildLine("Soda water", "(seltzer water)", resolver)).toMatchObject({
      ingredientSlug: "soda-water",
      note: null,
    });
    expect(buildLine("Sugar", "(if needed)", resolver)).toMatchObject({
      optional: true,
      note: null,
    });
  });

  it("only says of ice whether it is crushed", () => {
    expect(buildLine("Ice", "cubes", resolver)).toMatchObject({ note: null, optional: true });
    expect(buildLine("Ice", "crushed", resolver)).toMatchObject({ note: "Crushed ice" });
  });

  it("keeps a source name that describes the ingredient further", () => {
    expect(buildLine("Powdered sugar", "1 tsp", resolver)).toMatchObject({
      ingredientSlug: "sugar",
      amount: 5,
      note: null,
    });
    expect(buildLine("Powdered sugar", "", resolver)).toMatchObject({ note: "Powdered sugar" });
    // A brand is replaced by what it is.
    expect(buildLine("Jack Daniels", "1 part", resolver)).toMatchObject({
      ingredientSlug: "tennessee-whiskey",
      note: "1 part Tennessee whiskey",
    });
  });

  it("converts the measure and keeps the words qualifying the ingredient", () => {
    const recipe = normalizeTheCocktailDbDrink(
      drink({ strIngredient1: "Champagne", strMeasure1: "4 oz Chilled" }),
      resolver,
    );

    expect(recipe.lines[0]).toMatchObject({ amount: 120, unit: "ml", note: "Chilled Champagne" });
  });

  it("flags garnishes and optional ingredients, and never requires ice", () => {
    const recipe = normalizeTheCocktailDbDrink(
      drink({
        strIngredient1: "Mint",
        strMeasure1: "Garnish with",
        strIngredient2: "Sugar",
        strMeasure2: "1 tsp (optional)",
        strIngredient3: "Ice",
        strMeasure3: null,
      }),
      resolver,
    );

    expect(recipe.lines[0]).toMatchObject({ garnish: true });
    expect(recipe.lines[1]).toMatchObject({ optional: true });
    expect(recipe.lines[2]).toMatchObject({ ingredientSlug: "ice", optional: true });
  });

  it("turns a recipe with an unknown ingredient into a draft", () => {
    const recipe = normalizeTheCocktailDbDrink(
      drink({ strIngredient1: "Unicorn tears", strMeasure1: "1 oz" }),
      resolver,
    );

    expect(recipe.issues).toEqual(['Unknown ingredient "Unicorn tears"']);
  });

  it("files an unlisted category under other", () => {
    expect(
      normalizeTheCocktailDbDrink(drink({ strCategory: "Other / Unknown" }), resolver),
    ).toMatchObject({ category: "other" });
    expect(normalizeTheCocktailDbDrink(drink({ strCategory: "Shot" }), resolver).category).toBe(
      "shot",
    );
  });
});
