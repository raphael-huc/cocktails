import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { m } from "@/shared/i18n";
import { CocktailDetailSkeleton, CocktailListSkeleton } from "./CocktailSkeletons";

const meta = {
  title: "Modules/Catalog/CocktailSkeletons",
  component: CocktailListSkeleton,
} satisfies Meta<typeof CocktailListSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shown while the page of what the user can make loads. */
export const List: Story = {
  play: async ({ canvas }) => {
    // The grey blocks are silent; one status says the page is loading.
    await expect(canvas.getAllByRole("status")).toHaveLength(1);
    await expect(canvas.getByRole("status")).toHaveTextContent(m.loading());
  },
};

/** Shown while the page of every cocktail loads: it has a title and a search field. */
export const ListWithHeading: Story = {
  args: { withHeading: true, cards: 6 },
};

/** Shown while a cocktail's page loads. */
export const Detail: Story = {
  render: () => <CocktailDetailSkeleton />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent(m.loading());
  },
};
