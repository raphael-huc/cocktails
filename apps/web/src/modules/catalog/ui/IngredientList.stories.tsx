import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { m } from "@/shared/i18n";
import type { CocktailIngredient } from "../domain/cocktail";
import { IngredientList } from "./IngredientList";

/** A recipe line, with the defaults of a plain measured ingredient. */
function line(
  ingredientId: string,
  amount: number | null,
  unit: CocktailIngredient["unit"],
  overrides: Partial<CocktailIngredient> = {},
): CocktailIngredient {
  return { ingredientId, amount, unit, optional: false, garnish: false, note: null, ...overrides };
}

// An Old Fashioned: one line for each way a recipe can write a measure.
const lines = [
  line("bourbon", 60, "ml"),
  line("sugar-cube", 1, null),
  line("angostura-bitters", 2, "dash"),
  line("orange-bitters", 1, "dash", { optional: true }),
  line("orange-peel", null, null, { garnish: true, note: "A wide strip of orange peel" }),
];

const ingredientNames = new Map([
  ["bourbon", "Bourbon"],
  ["sugar-cube", "Sugar cube"],
  ["angostura-bitters", "Angostura bitters"],
  ["orange-bitters", "Orange bitters"],
  ["orange-peel", "Orange peel"],
]);

const meta = {
  title: "Modules/Catalog/IngredientList",
  component: IngredientList,
  args: { lines, ingredientNames },
} satisfies Meta<typeof IngredientList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByRole("listitem")).toHaveLength(5);

    await expect(canvas.getByText("60 ml")).toBeVisible();
    await expect(canvas.getByText("2 dashes")).toBeVisible();
    await expect(canvas.getByText("1 dash")).toBeVisible();
    // A count without unit is shown as is, next to the ingredient.
    await expect(canvas.getByText("Sugar cube").closest("li")).toHaveTextContent("1Sugar cube");

    // A note replaces the name of the ingredient.
    await expect(canvas.getByText("A wide strip of orange peel")).toBeVisible();
    await expect(canvas.queryByText("Orange peel")).not.toBeInTheDocument();

    await expect(canvas.getByText(m.cocktail_optional())).toBeVisible();
    await expect(canvas.getByText(m.cocktail_garnish())).toBeVisible();

    // Without the user's bar, no line says whether it is available.
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
    await expect(canvas.queryByText(m.cocktail_missing())).not.toBeInTheDocument();
  },
};

/** With the user's bar: what is at hand is ticked, and only a required ingredient is flagged. */
export const WithAvailability: Story = {
  args: {
    availableIngredientIds: new Set(["bourbon", "sugar-cube"]),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByRole("img", { name: m.cocktail_in_bar() })).toHaveLength(2);
    await expect(canvas.getByText("Bourbon").closest("li")).not.toHaveTextContent(
      m.cocktail_missing(),
    );

    // The optional bitters and the garnish are not at hand either, but do not block the drink.
    await expect(canvas.getAllByText(m.cocktail_missing())).toHaveLength(1);
    await expect(canvas.getByText("Angostura bitters").closest("li")).toHaveTextContent(
      m.cocktail_missing(),
    );
  },
};

/** Nothing in the bar: every required line is flagged, none is ticked. */
export const NothingAvailable: Story = {
  args: {
    availableIngredientIds: new Set<string>(),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByText(m.cocktail_missing())).toHaveLength(3);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

/** Larger text, for reading at arm's length while preparing. */
export const Large: Story = {
  args: {
    size: "lg",
  },
  play: async ({ canvas }) => {
    const list = await canvas.findByRole("list");

    await expect(Number.parseFloat(getComputedStyle(list).fontSize)).toBeGreaterThan(16);
  },
};
