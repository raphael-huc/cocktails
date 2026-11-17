import { describe, expect, it } from "vitest";
import { createIngredientResolver } from "../catalog/resolve.ts";
import { parseFreeTextLine } from "./free-text.ts";

const resolver = createIngredientResolver();
const parse = (text: string) => parseFreeTextLine(text, resolver);

describe("parseFreeTextLine", () => {
  it.each([
    ["2 dashes Angostura Bitters", "angostura-bitters", 2],
    ["1 dash Lime juice", "lime-juice", 1],
    ["Dash of Angostura bitters", "angostura-bitters", 1],
    ["3 to 4 dashes Angostura bitters", "angostura-bitters", 3],
    ["2 to 3 dashes of Worcestershire Sauce", "worcestershire-sauce", 2],
    ["2 dashes Peychaud’s bitters", "peychauds-bitters", 2],
  ])("reads %s as a measure in dashes", (text, slug, amount) => {
    expect(parse(text)).toMatchObject({ ingredientSlug: slug, amount, unit: "dash", note: null });
  });

  it.each([
    ["6 Mint sprigs", "mint", "6 Mint sprigs"],
    ["Top with Prosecco", "prosecco", "Top with Prosecco"],
    ["1/2 bar spoon Maraschino", "maraschino", "1/2 bar spoon Maraschino"],
    ["half fresh lime cut into 4 wedges", "lime", "Half fresh lime cut into 4 wedges"],
    [
      "Few slices fresh red hot chili peppers",
      "chili-pepper",
      "Few slices fresh red hot chili peppers",
    ],
    ["1 raw egg white (small egg)", "egg-white", "1 raw egg white"],
  ])("keeps the wording of %s as a note", (text, slug, note) => {
    expect(parse(text)).toMatchObject({ ingredientSlug: slug, amount: null, unit: null, note });
  });

  it("needs no note when the text is just the ingredient", () => {
    expect(parse("Soda water")).toMatchObject({ ingredientSlug: "soda-water", note: null });
  });

  it("prefers the most specific ingredient mentioned", () => {
    expect(parse("Celery salt")?.ingredientSlug).toBe("celery-salt");
    expect(parse("3 dashes Orange flower water")?.ingredientSlug).toBe("orange-flower-water");
  });

  it("detects optional ingredients", () => {
    expect(parse("Dash of Angostura bitters (optional)")).toMatchObject({
      optional: true,
      amount: 1,
      unit: "dash",
    });
    expect(parse("Optional orange twist")).toMatchObject({
      ingredientSlug: "orange",
      optional: true,
      note: "Orange twist",
    });
  });

  it("never lets water block a cocktail", () => {
    expect(parse("2 teaspoons water")).toMatchObject({ ingredientSlug: "water", optional: true });
  });

  it("marks garnishes", () => {
    expect(parseFreeTextLine("a cherry", resolver, { garnish: true })).toMatchObject({
      ingredientSlug: "maraschino-cherry",
      garnish: true,
      note: "Cherry",
    });
  });

  it("returns null when no known ingredient is mentioned", () => {
    expect(parse("Orance slice")).toBeNull();
  });
});
