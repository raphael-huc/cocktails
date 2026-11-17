import { describe, expect, it } from "vitest";
import type { Cocktail, CocktailIngredient } from "@/modules/catalog/domain/cocktail";
import type { Ingredient } from "@/modules/catalog/domain/ingredient";
import { groupByMissingIngredient, matchCocktails } from "./matching";

function ingredient(id: string, parentId: string | null = null): Ingredient {
  return { id, name: id, category: "other", parentId };
}

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

function cocktail(name: string, ingredients: CocktailIngredient[]): Cocktail {
  return {
    id: name,
    name,
    category: "cocktail",
    classic: false,
    glass: null,
    description: null,
    tint: null,
    imageUrl: null,
    thumbnailUrl: null,
    steps: [],
    ingredients,
  };
}

const ingredients = [
  ingredient("whiskey"),
  ingredient("bourbon", "whiskey"),
  ingredient("gin"),
  ingredient("campari"),
  ingredient("sweet-vermouth"),
  ingredient("sugar"),
  ingredient("bitters"),
  ingredient("orange-peel"),
];

const negroni = cocktail("Negroni", [
  line("gin"),
  line("campari"),
  line("sweet-vermouth"),
  line("orange-peel", { garnish: true, amount: null, unit: null }),
]);

const oldFashioned = cocktail("Old Fashioned", [
  line("whiskey"),
  line("sugar"),
  line("bitters", { amount: 2, unit: "dash" }),
]);

function statusOf(matches: ReturnType<typeof matchCocktails>, name: string) {
  return matches.find((match) => match.cocktail.name === name)?.status;
}

describe("matchCocktails", () => {
  it("marks a cocktail makeable when every required ingredient is owned", () => {
    const matches = matchCocktails([negroni], ingredients, ["gin", "campari", "sweet-vermouth"]);

    expect(matches[0]).toMatchObject({ status: "makeable", missingIngredientIds: [] });
  });

  it("ignores garnishes and optional ingredients", () => {
    const withOptional = cocktail("Gin Rickey", [line("gin"), line("sugar", { optional: true })]);

    expect(statusOf(matchCocktails([withOptional], ingredients, ["gin"]), "Gin Rickey")).toBe(
      "makeable",
    );
  });

  it("accepts a specific ingredient where a generic one is required", () => {
    const matches = matchCocktails([oldFashioned], ingredients, ["bourbon", "sugar", "bitters"]);

    expect(statusOf(matches, "Old Fashioned")).toBe("makeable");
  });

  it("does not accept a generic ingredient where a specific one is required", () => {
    const bourbonSour = cocktail("Bourbon Sour", [line("bourbon")]);

    expect(matchCocktails([bourbonSour], ingredients, ["whiskey"])[0]).toMatchObject({
      status: "almost",
      missingIngredientIds: ["bourbon"],
    });
  });

  it("reports what is missing when one ingredient away", () => {
    const matches = matchCocktails([negroni], ingredients, ["gin", "campari"]);

    expect(matches[0]).toMatchObject({
      status: "almost",
      missingIngredientIds: ["sweet-vermouth"],
    });
  });

  it("honours the maxMissing option", () => {
    const owned = ["gin"];

    expect(statusOf(matchCocktails([negroni], ingredients, owned), "Negroni")).toBe("unavailable");
    expect(
      statusOf(matchCocktails([negroni], ingredients, owned, { maxMissing: 2 }), "Negroni"),
    ).toBe("almost");
  });

  it("never matches a cocktail that has no required ingredient", () => {
    const empty = cocktail("Mystery", []);

    expect(statusOf(matchCocktails([empty], ingredients, ["gin"]), "Mystery")).toBe("unavailable");
  });

  it("orders results from the closest match to the furthest", () => {
    const matches = matchCocktails([oldFashioned, negroni], ingredients, [
      "gin",
      "campari",
      "sweet-vermouth",
      "sugar",
    ]);

    expect(matches.map((match) => match.cocktail.name)).toEqual(["Negroni", "Old Fashioned"]);
  });
});

describe("groupByMissingIngredient", () => {
  const ginTonic = cocktail("Gin and Tonic", [line("gin"), line("tonic")]);
  const vodkaTonic = cocktail("Vodka Tonic", [line("vodka"), line("tonic")]);
  const gimlet = cocktail("Gimlet", [line("gin"), line("lime-cordial")]);
  const longDrink = cocktail("Long Drink", [line("tonic"), line("lime-cordial")]);

  it("groups cocktails by the one ingredient they miss, most useful first", () => {
    const matches = matchCocktails([gimlet, ginTonic, vodkaTonic], [], ["gin", "vodka"]);

    const groups = groupByMissingIngredient(matches);

    expect(groups.map((group) => group.ingredientId)).toEqual(["tonic", "lime-cordial"]);
    expect(groups[0]?.matches.map((match) => match.cocktail.name)).toEqual([
      "Gin and Tonic",
      "Vodka Tonic",
    ]);
  });

  it("leaves out cocktails that nothing or more than one purchase would unlock", () => {
    const matches = matchCocktails([ginTonic, longDrink], [], ["gin", "tonic"], { maxMissing: 2 });

    // Gin and Tonic is already makeable; Long Drink misses the cordial alone.
    expect(groupByMissingIngredient(matches).map((group) => group.ingredientId)).toEqual([
      "lime-cordial",
    ]);
    // With neither tonic nor cordial, no single purchase unlocks Long Drink.
    expect(
      groupByMissingIngredient(matchCocktails([longDrink], [], ["gin"], { maxMissing: 2 })),
    ).toEqual([]);
  });
});
