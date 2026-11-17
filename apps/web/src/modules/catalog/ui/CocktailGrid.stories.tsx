import { Badge } from "@cocktails/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { m } from "@/shared/i18n";
import type { Cocktail } from "../domain/cocktail";
import { CocktailGrid, type CocktailGridItem, type CocktailGridProps } from "./CocktailGrid";

function cocktail(id: string, name: string, description: string | null, tint: string): Cocktail {
  // The grid only shows what a card shows: recipes are left out of the fixtures.
  return {
    id,
    name,
    category: "cocktail",
    classic: false,
    glass: null,
    description,
    tint,
    imageUrl: null,
    thumbnailUrl: null,
    ingredients: [],
    steps: [],
  };
}

const items: CocktailGridItem[] = [
  {
    cocktail: cocktail(
      "negroni",
      "Negroni",
      "Equal parts gin, Campari and sweet vermouth, stirred over ice.",
      "#b3261e",
    ),
    badge: <Badge tone="accent">{m.matches_makeable_title()}</Badge>,
  },
  {
    cocktail: cocktail(
      "boulevardier",
      "Boulevardier",
      "The same build with bourbon instead of gin.",
      "#8c2f1b",
    ),
    footer: m.matches_missing({ ingredients: "Bourbon" }),
  },
  {
    cocktail: cocktail(
      "daiquiri",
      "Daiquiri",
      "White rum shaken with lime juice and a little sugar.",
      "#d9e4a8",
    ),
  },
];

/** More than one page: the grid shows 30 cards at a time. */
const manyItems: CocktailGridItem[] = Array.from({ length: 35 }, (_, index) => ({
  cocktail: cocktail(
    `house-special-${index + 1}`,
    `House Special No. ${index + 1}`,
    null,
    "#c9a14a",
  ),
}));

/**
 * The grid remembers how far each list was unfolded for the whole visit. A
 * list of its own lets every run of a story start from the first page.
 */
function GridWithOwnList(props: CocktailGridProps) {
  const [listKey] = useState(() => `${props.listKey}-${crypto.randomUUID()}`);
  return <CocktailGrid {...props} listKey={listKey} />;
}

const meta = {
  title: "Modules/Catalog/CocktailGrid",
  component: CocktailGrid,
  args: { listKey: "story", items },
  render: (args) => <GridWithOwnList {...args} />,
} satisfies Meta<typeof CocktailGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A short list fits on one page: there is nothing more to show. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByRole("link")).toHaveLength(3);
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();

    // Each item hands its own status and footer to its card.
    await expect(canvas.getByRole("link", { name: /Negroni/ })).toHaveTextContent(
      m.matches_makeable_title(),
    );
    await expect(canvas.getByRole("link", { name: /^Boulevardier/ })).toHaveTextContent(
      "Missing: Bourbon",
    );
  },
};

/** A long list unfolds a page at a time, and says how many cards the next page brings. */
export const Paginated: Story = {
  args: { items: manyItems },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findAllByRole("link")).toHaveLength(30);

    await userEvent.click(canvas.getByRole("button", { name: m.list_show_more({ count: 5 }) }));

    await expect(canvas.getAllByRole("link")).toHaveLength(35);
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

/** With the names of the ingredients, a cocktail without description is summed up by them. */
export const SummarisedByIngredients: Story = {
  args: {
    items: [
      {
        cocktail: {
          ...cocktail("negroni", "Negroni", null, "#b3261e"),
          ingredients: [
            {
              ingredientId: "gin",
              amount: 30,
              unit: "ml",
              optional: false,
              garnish: false,
              note: null,
            },
            {
              ingredientId: "campari",
              amount: 30,
              unit: "ml",
              optional: false,
              garnish: false,
              note: null,
            },
          ],
        },
      },
    ],
    ingredientNames: new Map([
      ["gin", "Gin"],
      ["campari", "Campari"],
    ]),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Gin · Campari")).toBeVisible();
  },
};
