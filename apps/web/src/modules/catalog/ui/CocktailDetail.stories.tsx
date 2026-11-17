import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { m } from "@/shared/i18n";
import type { Cocktail, CocktailIngredient } from "../domain/cocktail";
import { CocktailDetail } from "./CocktailDetail";

// An inline picture keeps the stories independent from the network.
const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" fill="#b3261e"/><circle cx="160" cy="160" r="80" fill="#e9a23b"/></svg>',
)}`;

/** A recipe line, with the defaults of a plain measured ingredient. */
function line(
  ingredientId: string,
  amount: number | null,
  unit: CocktailIngredient["unit"],
  overrides: Partial<CocktailIngredient> = {},
): CocktailIngredient {
  return { ingredientId, amount, unit, optional: false, garnish: false, note: null, ...overrides };
}

const ingredientNames = new Map([
  ["gin", "Gin"],
  ["campari", "Campari"],
  ["sweet-vermouth", "Sweet vermouth"],
  ["orange-peel", "Orange peel"],
  ["bourbon", "Bourbon"],
  ["sugar-cube", "Sugar cube"],
  ["angostura-bitters", "Angostura bitters"],
  ["orange-bitters", "Orange bitters"],
]);

const negroni: Cocktail = {
  id: "negroni",
  name: "Negroni",
  category: "cocktail",
  classic: false,
  glass: null,
  description:
    "Equal parts gin, Campari and sweet vermouth, stirred over ice. Bitter, sweet and strong.",
  tint: "#b3261e",
  imageUrl: photo,
  thumbnailUrl: null,
  ingredients: [
    line("gin", 30, "ml"),
    line("campari", 30, "ml"),
    line("sweet-vermouth", 30, "ml"),
    line("orange-peel", null, null, { garnish: true }),
  ],
  steps: [
    "Pour the gin, Campari and vermouth into a mixing glass filled with ice.",
    "Stir until well chilled, about 30 seconds.",
    "Strain into a rocks glass over a large ice cube and garnish with the orange peel.",
  ],
};

const oldFashioned: Cocktail = {
  id: "old-fashioned",
  name: "Old Fashioned",
  category: "cocktail",
  classic: false,
  glass: null,
  description: "Whiskey, sugar and bitters: the original cocktail.",
  tint: "#b5651d",
  imageUrl: null,
  thumbnailUrl: null,
  ingredients: [
    line("bourbon", 60, "ml"),
    line("sugar-cube", 1, null),
    line("angostura-bitters", 2, "dash"),
    line("orange-bitters", 1, "dash", { optional: true }),
    line("orange-peel", null, null, { garnish: true, note: "A wide strip of orange peel" }),
  ],
  steps: [
    "Muddle the sugar cube with the bitters in a rocks glass.",
    "Add the bourbon and a large ice cube, then stir.",
  ],
};

const meta = {
  title: "Modules/Catalog/CocktailDetail",
  component: CocktailDetail,
  args: { cocktail: negroni, ingredientNames },
} satisfies Meta<typeof CocktailDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Negroni" })).toBeVisible();
    await expect(
      canvas.getByRole("img", { name: m.cocktail_photo_alt({ name: "Negroni" }) }),
    ).toBeVisible();
    await expect(canvas.getByRole("heading", { name: m.cocktail_ingredients() })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: m.cocktail_steps() })).toBeVisible();

    // Ingredients are shown by name, with their measure when the recipe gives one.
    await expect(canvas.getAllByText("30 ml")).toHaveLength(3);
    await expect(canvas.getByText("Sweet vermouth")).toBeVisible();
    await expect(canvas.getByText(m.cocktail_garnish())).toBeVisible();
    await expect(canvas.queryByText(m.cocktail_optional())).not.toBeInTheDocument();

    await expect(canvas.getByText(/Stir until well chilled/)).toBeVisible();

    // A recipe with a method can be followed step by step.
    await expect(canvas.getByRole("link", { name: m.cocktail_start_making() })).toHaveAttribute(
      "href",
      "/cocktails/negroni/make",
    );
    await expect(canvas.getByText(m.cocktail_category_cocktail())).toBeVisible();
    await expect(canvas.queryByText(m.cocktail_classic())).not.toBeInTheDocument();
  },
};

/** An established recipe says so, and names the glass it is served in. */
export const ClassicWithGlass: Story = {
  args: { cocktail: { ...oldFashioned, classic: true, glass: "old-fashioned" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(m.cocktail_classic())).toBeVisible();
    await expect(canvas.getByText("Old fashioned glass")).toBeVisible();
  },
};

/** With the user's bar: each line says whether it is at hand, and what has to be bought. */
export const WithBarAvailability: Story = {
  args: {
    cocktail: oldFashioned,
    availableIngredientIds: new Set(["bourbon", "sugar-cube"]),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByRole("img", { name: m.cocktail_in_bar() })).toHaveLength(2);

    // Only a required ingredient is flagged: not the optional bitters, not the garnish.
    await expect(canvas.getAllByText(m.cocktail_missing())).toHaveLength(1);
    await expect(canvas.getByText("Angostura bitters").closest("li")).toHaveTextContent(
      m.cocktail_missing(),
    );
  },
};

/**
 * Every way a line can be written: millilitres, one or several dashes, a bare
 * count, no measure, and a note that replaces the ingredient name.
 */
export const MixedMeasures: Story = {
  args: { cocktail: oldFashioned },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("60 ml")).toBeVisible();
    await expect(canvas.getByText("2 dashes")).toBeVisible();
    await expect(canvas.getByText("1 dash")).toBeVisible();
    // A count without unit is shown as is, next to the ingredient.
    await expect(canvas.getByText("Sugar cube").closest("li")).toHaveTextContent("1Sugar cube");

    await expect(canvas.getByText(m.cocktail_optional())).toBeVisible();
    await expect(canvas.getByText(m.cocktail_garnish())).toBeVisible();

    await expect(canvas.getByText("A wide strip of orange peel")).toBeVisible();
    await expect(canvas.queryByText("Orange peel")).not.toBeInTheDocument();
  },
};

/** A bare recipe: no picture, description or method. Those parts disappear instead of showing empty. */
export const IngredientsOnly: Story = {
  args: { cocktail: { ...negroni, description: null, imageUrl: null, steps: [] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Negroni" })).toBeVisible();
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("heading", { name: m.cocktail_steps() }),
    ).not.toBeInTheDocument();
    await expect(canvas.queryByText(/Equal parts gin/)).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: m.cocktail_start_making() }),
    ).not.toBeInTheDocument();
  },
};

/** An ingredient missing from the catalog is shown by its identifier rather than dropped. */
export const UnknownIngredient: Story = {
  args: { ingredientNames: new Map([["gin", "Gin"]]) },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Gin")).toBeVisible();
    await expect(canvas.getByText("campari")).toBeVisible();
    await expect(canvas.getByText("sweet-vermouth")).toBeVisible();
  },
};
