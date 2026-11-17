import { describe, expect, it } from "vitest";
import { createIngredientResolver } from "../catalog/resolve.ts";
import { splitIntoSteps } from "../normalize/steps.ts";
import { normalizeIbaRecipe } from "./iba.ts";

const resolver = createIngredientResolver();

describe("normalizeIbaRecipe", () => {
  const manhattan = normalizeIbaRecipe(
    {
      name: "Manhattan",
      glass: "martini",
      ingredients: [
        { unit: "cl", amount: 5, ingredient: "Whiskey", label: "Rye whiskey" },
        { unit: "cl", amount: 2, ingredient: "Vermouth", label: "Red vermouth" },
        { special: "1 dash Angostura Bitters" },
      ],
      garnish: "Cherry",
      preparation: "Stir in mixing glass with ice cubes. Strain into chilled martini glass.",
    },
    resolver,
  );

  it("converts centilitres to millilitres and prefers the precise variant", () => {
    expect(manhattan.lines[0]).toMatchObject({
      ingredientSlug: "rye-whiskey",
      amount: 50,
      unit: "ml",
    });
    expect(manhattan.lines[1]).toMatchObject({ ingredientSlug: "sweet-vermouth", amount: 20 });
  });

  it("reads free-text lines and the garnish", () => {
    expect(manhattan.lines[2]).toMatchObject({ ingredientSlug: "angostura-bitters", unit: "dash" });
    expect(manhattan.lines[3]).toMatchObject({
      ingredientSlug: "maraschino-cherry",
      garnish: true,
    });
  });

  it("identifies the recipe and splits its steps", () => {
    expect(manhattan).toMatchObject({
      source: "iba",
      sourceId: "manhattan",
      glass: "martini",
      category: "cocktail",
    });
    expect(manhattan.steps).toHaveLength(2);
    expect(manhattan.issues).toEqual([]);
  });

  it("reports an unknown ingredient instead of dropping it silently", () => {
    const recipe = normalizeIbaRecipe(
      {
        name: "Mystery",
        ingredients: [{ unit: "cl", amount: 3, ingredient: "Unicorn tears" }],
        preparation: "Stir.",
      },
      resolver,
    );

    expect(recipe.lines).toEqual([]);
    expect(recipe.issues).toEqual(['Unknown ingredient "Unicorn tears"']);
  });

  it("describes an unidentified garnish in the steps", () => {
    const recipe = normalizeIbaRecipe(
      { name: "Typo", ingredients: [], garnish: "Orance slice", preparation: "Build." },
      resolver,
    );

    expect(recipe.steps).toEqual(["Build.", "Garnish: Orance slice."]);
  });
});

describe("splitIntoSteps", () => {
  it("makes one step per sentence and closes the last one", () => {
    expect(splitIntoSteps("Shake with ice. Strain into a glass")).toEqual([
      "Shake with ice.",
      "Strain into a glass.",
    ]);
  });

  it("returns nothing for empty instructions", () => {
    expect(splitIntoSteps("  ")).toEqual([]);
  });
});

describe("splitIntoSteps tidying", () => {
  it("drops hand-written numbering", () => {
    expect(splitIntoSteps("1) Add the gin. 2) Fill with ice. 3. Stir gently.")).toEqual([
      "Add the gin.",
      "Fill with ice.",
      "Stir gently.",
    ]);
  });

  it("calms shouting and strings of punctuation", () => {
    expect(splitIntoSteps("Pour over ice. DO NOT STIR!!!!!")).toEqual([
      "Pour over ice.",
      "Do not stir!",
    ]);
  });

  it("drops sign-offs that are not instructions", () => {
    expect(splitIntoSteps("Shake well. Enjoy!!! ")).toEqual(["Shake well."]);
    expect(splitIntoSteps("Stir. ENJOY!!")).toEqual(["Stir."]);
  });

  it("starts every step with a capital", () => {
    expect(splitIntoSteps("shake with ice")).toEqual(["Shake with ice."]);
  });
});
