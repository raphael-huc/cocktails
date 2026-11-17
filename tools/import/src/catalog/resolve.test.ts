import { describe, expect, it } from "vitest";
import { createIngredientResolver } from "./resolve.ts";

describe("createIngredientResolver", () => {
  it("accepts the real catalog: unique slugs and names, known parents", () => {
    expect(() => createIngredientResolver()).not.toThrow();
  });

  const resolver = createIngredientResolver();

  it("matches names and aliases whatever the case and accents", () => {
    expect(resolver.exact("Créme de Cassis")?.slug).toBe("creme-de-cassis");
    expect(resolver.exact("GOMME SYRUP")?.slug).toBe("simple-syrup");
    expect(resolver.exact("DiSaronno")?.slug).toBe("amaretto");
  });

  it("does not guess: an unknown name has no exact match", () => {
    expect(resolver.exact("Unicorn tears")).toBeUndefined();
  });

  it("rejects a name used by two ingredients", () => {
    expect(() =>
      createIngredientResolver([
        { slug: "a", name: "Soda", nameFr: "Soda", category: "mixer" },
        { slug: "b", name: "Club soda", nameFr: "Club soda", category: "mixer", aliases: ["soda"] },
      ]),
    ).toThrow(/names both/);
  });

  it("rejects an unknown parent", () => {
    expect(() =>
      createIngredientResolver([
        { slug: "a", name: "A", nameFr: "A", category: "other", parent: "missing" },
      ]),
    ).toThrow(/Unknown parent/);
  });
});
