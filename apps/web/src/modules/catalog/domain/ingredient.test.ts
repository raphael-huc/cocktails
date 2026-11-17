import { describe, expect, it } from "vitest";
import { type Ingredient, withAncestors } from "./ingredient";

function ingredient(id: string, parentId: string | null = null): Ingredient {
  return { id, name: id, category: "spirit", parentId };
}

describe("withAncestors", () => {
  const ingredients = [
    ingredient("whiskey"),
    ingredient("bourbon", "whiskey"),
    ingredient("wheated-bourbon", "bourbon"),
    ingredient("gin"),
  ];

  it("includes every ancestor of an owned ingredient", () => {
    expect(withAncestors(["wheated-bourbon"], ingredients)).toEqual(
      new Set(["wheated-bourbon", "bourbon", "whiskey"]),
    );
  });

  it("does not include descendants", () => {
    expect(withAncestors(["whiskey"], ingredients)).toEqual(new Set(["whiskey"]));
  });

  it("keeps ingredients that are not in the catalog", () => {
    expect(withAncestors(["unknown"], ingredients)).toEqual(new Set(["unknown"]));
  });

  it("terminates when the hierarchy contains a cycle", () => {
    const cyclic = [ingredient("a", "b"), ingredient("b", "a")];
    expect(withAncestors(["a"], cyclic)).toEqual(new Set(["a", "b"]));
  });
});
