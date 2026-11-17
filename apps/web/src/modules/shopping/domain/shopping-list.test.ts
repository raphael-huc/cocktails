import { describe, expect, it } from "vitest";
import {
  cleanLabel,
  hasIngredient,
  type ShoppingItem,
  toShoppingEntries,
  withIngredient,
  withoutIngredient,
  withoutItem,
} from "./shopping-list";

const gin: ShoppingItem = { id: "1", ingredientId: "gin", label: null };
const soil: ShoppingItem = { id: "2", ingredientId: null, label: "Potting soil" };

describe("shopping list", () => {
  it("holds each ingredient once", () => {
    expect(withIngredient([gin], "gin", "new")).toEqual([gin]);
    expect(withIngredient([gin], "tonic", "new")).toEqual([
      gin,
      { id: "new", ingredientId: "tonic", label: null },
    ]);
  });

  it("knows whether an ingredient is on it", () => {
    expect(hasIngredient([gin, soil], "gin")).toBe(true);
    expect(hasIngredient([soil], "gin")).toBe(false);
  });

  it("removes an ingredient without touching the other items", () => {
    expect(withoutIngredient([gin, soil], "gin")).toEqual([soil]);
    expect(withoutIngredient([soil], "gin")).toEqual([soil]);
  });

  it("removes an item by its id", () => {
    expect(withoutItem([gin, soil], "2")).toEqual([gin]);
  });
});

describe("cleanLabel", () => {
  it("trims and collapses spaces", () => {
    expect(cleanLabel("  Potting   soil ")).toBe("Potting soil");
  });

  it("refuses an empty label", () => {
    expect(cleanLabel("   ")).toBeNull();
  });
});

describe("toShoppingEntries", () => {
  const names = new Map([
    ["tonic", "Tonic water"],
    ["gin", "Gin"],
  ]);
  const tonic: ShoppingItem = { id: "3", ingredientId: "tonic", label: null };

  it("shows what is left to buy first, then what the bar already has, by name", () => {
    const entries = toShoppingEntries([tonic, gin, soil], names, new Set(["gin"]));

    expect(entries).toEqual([
      { id: "2", name: "Potting soil", ingredientId: null, owned: false },
      { id: "3", name: "Tonic water", ingredientId: "tonic", owned: false },
      { id: "1", name: "Gin", ingredientId: "gin", owned: true },
    ]);
  });

  it("falls back to the label when the catalog does not know the ingredient", () => {
    const item: ShoppingItem = { id: "4", ingredientId: "gone", label: "Old bottle" };

    expect(toShoppingEntries([item], names, new Set())).toEqual([
      { id: "4", name: "Old bottle", ingredientId: null, owned: false },
    ]);
  });

  it("leaves out an item with nothing to show", () => {
    const item: ShoppingItem = { id: "5", ingredientId: "gone", label: null };

    expect(toShoppingEntries([item], names, new Set())).toEqual([]);
  });
});
