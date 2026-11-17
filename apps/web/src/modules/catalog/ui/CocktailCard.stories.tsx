import { Badge } from "@cocktails/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { m } from "@/shared/i18n";
import type { Cocktail } from "../domain/cocktail";
import { CocktailCard } from "./CocktailCard";

// An inline picture keeps the stories independent from the network.
const thumbnail = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect width="72" height="72" fill="#b3261e"/><circle cx="36" cy="36" r="18" fill="#e9a23b"/></svg>',
)}`;

const negroni: Cocktail = {
  id: "negroni",
  name: "Negroni",
  category: "cocktail",
  classic: false,
  glass: null,
  description:
    "Equal parts gin, Campari and sweet vermouth, stirred over ice. Bitter, sweet and strong.",
  tint: "#b3261e",
  imageUrl: null,
  thumbnailUrl: null,
  ingredients: [
    { ingredientId: "gin", amount: 30, unit: "ml", optional: false, garnish: false, note: null },
    {
      ingredientId: "campari",
      amount: 30,
      unit: "ml",
      optional: false,
      garnish: false,
      note: null,
    },
    {
      ingredientId: "sweet-vermouth",
      amount: 30,
      unit: "ml",
      optional: false,
      garnish: false,
      note: null,
    },
  ],
  steps: ["Stir all the ingredients with ice.", "Strain into a rocks glass over fresh ice."],
};

const meta = {
  title: "Modules/Catalog/CocktailCard",
  component: CocktailCard,
  args: { cocktail: negroni },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CocktailCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // The whole card is the link to the cocktail's page.
    const card = await canvas.findByRole("link", { name: /Negroni/ });

    await expect(card).toHaveAttribute("href", "/cocktails/negroni");
    await expect(canvas.getByRole("heading", { name: "Negroni" })).toBeVisible();
    await expect(canvas.getByText(/Equal parts gin/)).toBeVisible();
    await expect(card.querySelector("img")).not.toBeInTheDocument();
  },
};

/** The picture is decorative: it adds nothing to what assistive technologies announce. */
export const WithThumbnail: Story = {
  args: { cocktail: { ...negroni, thumbnailUrl: thumbnail } },
  play: async ({ canvas }) => {
    const card = await canvas.findByRole("link", { name: /Negroni/ });

    await expect(card.querySelector("img")).toHaveAttribute("alt", "");
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

/** The matching list uses the footer to say what is missing to make the drink. */
export const WithFooter: Story = {
  args: {
    footer: m.matches_missing({ ingredients: "Campari" }),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Missing: Campari")).toBeVisible();
  },
};

/** A cocktail the catalog knows little about: the card falls back to its name alone. */
export const WithoutDescriptionOrTint: Story = {
  args: {
    cocktail: {
      ...negroni,
      id: "house-highball",
      name: "House Highball",
      description: null,
      tint: null,
    },
  },
  play: async ({ canvas }) => {
    const card = await canvas.findByRole("link", { name: "House Highball" });

    await expect(card).toHaveAttribute("href", "/cocktails/house-highball");
    await expect(card.style.borderLeftColor).toBe("");
  },
};

/** A short status above the name, as the list of every cocktail shows what can be made. */
export const WithBadge: Story = {
  args: {
    badge: <Badge tone="accent">{m.matches_makeable_title()}</Badge>,
  },
  play: async ({ canvas }) => {
    const card = await canvas.findByRole("link", { name: /Negroni/ });

    // The status comes first, so it is also announced first.
    await expect(card).toHaveTextContent(new RegExp(`^${m.matches_makeable_title()}Negroni`));
  },
};

/** Without description, the main ingredients sum the cocktail up so cards do not all look alike. */
export const SummarisedByIngredients: Story = {
  args: {
    cocktail: { ...negroni, description: null },
    ingredientNames: new Map([
      ["gin", "Gin"],
      ["campari", "Campari"],
    ]),
  },
  play: async ({ canvas }) => {
    // An ingredient the catalog cannot name falls back to its identifier.
    await expect(await canvas.findByText("Gin · Campari · sweet-vermouth")).toBeVisible();
  },
};
