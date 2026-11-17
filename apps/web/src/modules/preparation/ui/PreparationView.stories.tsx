import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import type { Cocktail } from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { PreparationView } from "./PreparationView";

const negroni: Cocktail = {
  id: "negroni",
  name: "Negroni",
  category: "cocktail",
  classic: true,
  glass: "old-fashioned",
  description: "Equal parts gin, Campari and sweet vermouth, stirred over ice.",
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
  steps: [
    "Pour the gin, Campari and vermouth into a mixing glass filled with ice.",
    "Stir until well chilled, about 30 seconds.",
    "Strain into a rocks glass over a large ice cube.",
  ],
};

const ingredientNames = new Map([
  ["gin", "Gin"],
  ["campari", "Campari"],
  ["sweet-vermouth", "Sweet vermouth"],
]);

const meta = {
  title: "Modules/Preparation/PreparationView",
  component: PreparationView,
  args: { cocktail: negroni, ingredientNames, stageIndex: 0, onStageChange: fn() },
} satisfies Meta<typeof PreparationView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before starting: everything to put on the counter. There is nothing to go back to. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("heading", { name: m.prep_gather() })).toBeVisible();
    await expect(canvas.getAllByText("30 ml")).toHaveLength(3);
    await expect(canvas.getByRole("link", { name: new RegExp(m.prep_exit()) })).toHaveAttribute(
      "href",
      "/cocktails/negroni",
    );

    await expect(canvas.getByRole("button", { name: m.prep_previous() })).toBeDisabled();

    await userEvent.click(canvas.getByRole("button", { name: m.prep_start() }));
    await expect(args.onStageChange).toHaveBeenLastCalledWith(1);
  },
};

/** In the middle of the recipe: one step, its position, and a way in both directions. */
export const MiddleStep: Story = {
  args: { stageIndex: 2 },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByText(m.prep_step({ current: 2, total: 3 }))).toBeVisible();
    await expect(canvas.getByText(/Stir until well chilled/)).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: m.prep_gather() })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: m.prep_previous() }));
    await expect(args.onStageChange).toHaveBeenLastCalledWith(1);

    await userEvent.click(canvas.getByRole("button", { name: m.prep_next() }));
    await expect(args.onStageChange).toHaveBeenLastCalledWith(3);
  },
};

/** On the last step, "Next" gives way to a link back to the recipe. */
export const LastStep: Story = {
  args: { stageIndex: 3 },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(m.prep_step({ current: 3, total: 3 }))).toBeVisible();

    await expect(canvas.getByRole("link", { name: m.prep_done() })).toHaveAttribute(
      "href",
      "/cocktails/negroni",
    );
    await expect(canvas.queryByRole("button", { name: m.prep_next() })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: m.prep_previous() })).toBeEnabled();
  },
};

/** A position past the end, as an address typed by hand could give, lands on the last step. */
export const PositionOutOfRange: Story = {
  args: { stageIndex: 42 },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(m.prep_step({ current: 3, total: 3 }))).toBeVisible();
    await expect(canvas.getByRole("link", { name: m.prep_done() })).toBeVisible();
  },
};

/** Wired to local state: the whole recipe, from the ingredients to the last step and back. */
export const Interactive: Story = {
  render: function InteractivePreparationView(args) {
    const [stageIndex, setStageIndex] = useState(args.stageIndex);
    return <PreparationView {...args} stageIndex={stageIndex} onStageChange={setStageIndex} />;
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: m.prep_start() }));
    await expect(canvas.getByText(m.prep_step({ current: 1, total: 3 }))).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: m.prep_next() }));
    await userEvent.click(canvas.getByRole("button", { name: m.prep_next() }));
    await expect(canvas.getByText(m.prep_step({ current: 3, total: 3 }))).toBeVisible();
    await expect(canvas.getByRole("link", { name: m.prep_done() })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: m.prep_previous() }));
    await expect(canvas.getByText(/Stir until well chilled/)).toBeVisible();
  },
};
