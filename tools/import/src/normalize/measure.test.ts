import { describe, expect, it } from "vitest";
import { parseMeasure } from "./measure.ts";

describe("parseMeasure", () => {
  it.each([
    ["1 oz", 30],
    ["1 1/2 oz", 45],
    ["1/2 oz", 15],
    ["1.5 oz", 45],
    ["2-3 oz", 60],
    ["4 cl", 40],
    ["25 ml", 25],
    ["1 tsp", 5],
    ["2 tblsp", 30],
    ["1 shot", 45],
    ["2 shots", 90],
    ["1 cup", 240],
    ["2 cups", 480],
    ["1 oz.", 30],
    ["  1  1/2   OZ ", 45],
  ])("reads %s as %d ml", (text, amount) => {
    expect(parseMeasure(text)).toEqual({ amount, unit: "ml", qualifier: null });
  });

  it("keeps dashes as dashes", () => {
    expect(parseMeasure("2 dashes")).toEqual({ amount: 2, unit: "dash", qualifier: null });
    expect(parseMeasure("1 dash")).toEqual({ amount: 1, unit: "dash", qualifier: null });
  });

  it("separates the words that qualify the ingredient", () => {
    expect(parseMeasure("4 oz Chilled")).toEqual({ amount: 120, unit: "ml", qualifier: "Chilled" });
  });

  it.each(["", "Juice of 1", "1 part", "Top", "1", "3 drops", "Garnish with", "1 slice"])(
    "does not guess %j",
    (text) => {
      expect(parseMeasure(text)).toBeNull();
    },
  );
});

describe("parseMeasure, less common notations", () => {
  it("reads fraction characters", () => {
    expect(parseMeasure("½ oz")).toMatchObject({ amount: 15, unit: "ml" });
    expect(parseMeasure("1½ oz")).toMatchObject({ amount: 45, unit: "ml" });
    expect(parseMeasure("¾ cup")).toMatchObject({ amount: 180, unit: "ml" });
  });

  it("reads the large units of punch recipes", () => {
    expect(parseMeasure("1 qt")).toMatchObject({ amount: 950, unit: "ml" });
    expect(parseMeasure("1 gal")).toMatchObject({ amount: 3800, unit: "ml" });
    expect(parseMeasure("1 fifth")).toMatchObject({ amount: 750, unit: "ml" });
  });
});
