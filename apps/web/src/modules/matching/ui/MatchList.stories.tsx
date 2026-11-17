import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import type { Cocktail } from "@/modules/catalog";
import { m } from "@/shared/i18n";
import type { CocktailMatch, MissingIngredientGroup } from "../domain/matching";
import { MatchList, type MatchListProps } from "./MatchList";

function cocktail(id: string, name: string, description: string, tint: string): Cocktail {
  // The list only shows what a card shows: recipes are left out of the fixtures.
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

function almost(missing: string, found: Cocktail): CocktailMatch {
  return { cocktail: found, status: "almost", missingIngredientIds: [missing] };
}

const makeable: CocktailMatch[] = [
  {
    cocktail: cocktail(
      "daiquiri",
      "Daiquiri",
      "White rum shaken with lime juice and a little sugar.",
      "#d9e4a8",
    ),
    status: "makeable",
    missingIngredientIds: [],
  },
  {
    cocktail: cocktail(
      "negroni",
      "Negroni",
      "Equal parts gin, Campari and sweet vermouth, stirred over ice.",
      "#b3261e",
    ),
    status: "makeable",
    missingIngredientIds: [],
  },
];

// Grouped by the ingredient that is missing, the most useful purchase first.
const almostGroups: MissingIngredientGroup[] = [
  {
    ingredientId: "bourbon",
    matches: [
      almost(
        "bourbon",
        cocktail(
          "boulevardier",
          "Boulevardier",
          "A Negroni made with bourbon instead of gin.",
          "#8c2f1b",
        ),
      ),
      almost(
        "bourbon",
        cocktail("whiskey-sour", "Whiskey Sour", "Bourbon balanced by lemon and sugar.", "#e3b04b"),
      ),
    ],
  },
  {
    ingredientId: "tequila",
    matches: [
      almost(
        "tequila",
        cocktail(
          "margarita",
          "Margarita",
          "Tequila, triple sec and lime juice, served with a salted rim.",
          "#e3e6b5",
        ),
      ),
    ],
  },
];

const ingredientNames = new Map([
  ["bourbon", "Bourbon"],
  ["tequila", "Tequila"],
]);

const meta = {
  title: "Modules/Matching/MatchList",
  component: MatchList,
  args: { listKey: "story", makeable, almostGroups, ingredientNames },
} satisfies Meta<typeof MatchList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(
      await canvas.findByRole("heading", { name: m.matches_makeable_title() }),
    ).toBeVisible();
    await expect(canvas.getByRole("heading", { name: m.matches_almost_title() })).toBeVisible();

    // The best purchase is unfolded: it shows the cocktails it would unlock.
    await expect(canvas.getByText("Bourbon")).toBeVisible();
    await expect(canvas.getByText("2 cocktails")).toBeVisible();
    await expect(canvas.getByRole("link", { name: /^Boulevardier/ })).toBeVisible();

    // The others are folded until asked for.
    await expect(canvas.getByRole("link", { name: /^Margarita/ })).not.toBeVisible();
    await userEvent.click(canvas.getByText("Tequila"));
    await expect(canvas.getByRole("link", { name: /^Margarita/ })).toBeVisible();
  },
};

export const OnlyMakeable: Story = {
  args: { almostGroups: [] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("heading", { name: m.matches_makeable_title() }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("heading", { name: m.matches_almost_title() }),
    ).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("link")).toHaveLength(2);
  },
};

export const OnlyAlmost: Story = {
  args: { makeable: [] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("heading", { name: m.matches_almost_title() }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("heading", { name: m.matches_makeable_title() }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByText("1 cocktail")).toBeVisible();
  },
};

// Twelve purchases that would each unlock one cocktail: more than the ten listed at first.
const manyGroups: MissingIngredientGroup[] = [
  "Absinthe",
  "Amaretto",
  "Aperol",
  "Bourbon",
  "Cognac",
  "Falernum",
  "Maraschino",
  "Mezcal",
  "Pisco",
  "Rye",
  "Tequila",
  "Vodka",
].map((name) => {
  const id = name.toLowerCase();
  return {
    ingredientId: id,
    matches: [
      almost(id, cocktail(`${id}-sour`, `${name} Sour`, `${name}, lemon and sugar.`, "#e3b04b")),
    ],
  };
});

/**
 * The list remembers how far it was unfolded for the whole visit. A list of
 * its own lets every run of the story start from the first page.
 */
function ListWithOwnKey(props: MatchListProps) {
  const [listKey] = useState(() => `${props.listKey}-${crypto.randomUUID()}`);
  return <MatchList {...props} listKey={listKey} />;
}

/** The most useful purchases come first; the rest is one "show more" away. */
export const ManyMissingIngredients: Story = {
  args: { makeable: [], almostGroups: manyGroups },
  render: (args) => <ListWithOwnKey {...args} />,
  play: async ({ canvas, userEvent }) => {
    // Each missing ingredient is a foldable group.
    await expect(await canvas.findAllByRole("group")).toHaveLength(10);
    // An ingredient the catalog cannot name is shown by its identifier.
    await expect(canvas.getByText("absinthe")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: m.list_show_more({ count: 2 }) }));

    await expect(canvas.getAllByRole("group")).toHaveLength(12);
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

/** Nothing owned yet: the list invites the user to fill their bar. */
export const Empty: Story = {
  args: { makeable: [], almostGroups: [] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(m.matches_empty())).toBeVisible();
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
  },
};
