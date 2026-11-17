import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import type { Ingredient } from "@/modules/catalog";
import { m } from "@/shared/i18n";
import { PantryList } from "./PantryList";

// Deliberately out of order: the list groups by category and sorts by name.
const ingredients: Ingredient[] = [
  { id: "white-rum", name: "White rum", category: "spirit", parentId: null },
  { id: "lime-juice", name: "Lime juice", category: "juice", parentId: null },
  { id: "gin", name: "Gin", category: "spirit", parentId: null },
  { id: "sweet-vermouth", name: "Sweet vermouth", category: "fortified_wine", parentId: null },
  { id: "campari", name: "Campari", category: "liqueur", parentId: null },
  { id: "bourbon", name: "Bourbon", category: "spirit", parentId: null },
  { id: "simple-syrup", name: "Simple syrup", category: "syrup", parentId: null },
  { id: "triple-sec", name: "Triple sec", category: "liqueur", parentId: null },
  { id: "mint", name: "Mint", category: "fresh", parentId: null },
];

const meta = {
  title: "Modules/Pantry/PantryList",
  component: PantryList,
  args: {
    ingredients,
    ownedIds: new Set(["gin", "campari", "lime-juice"]),
    onToggle: fn(),
  },
} satisfies Meta<typeof PantryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const gin = await canvas.findByRole("button", { name: "Gin", pressed: true });
    const bourbon = canvas.getByRole("button", { name: "Bourbon", pressed: false });

    // Categories follow the catalog's order, ingredients are sorted inside each one.
    const headings = canvas.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    await expect(headings).toEqual([
      m.category_spirit(),
      m.category_liqueur(),
      m.category_fortified_wine(),
      m.category_juice(),
      m.category_syrup(),
      m.category_fresh(),
    ]);
    const chips = canvas.getAllByRole("button").map((node) => node.textContent);
    await expect(chips.slice(0, 3)).toEqual(["Bourbon", "Gin", "White rum"]);

    await userEvent.click(bourbon);
    await expect(args.onToggle).toHaveBeenLastCalledWith("bourbon", true);

    await userEvent.click(gin);
    await expect(args.onToggle).toHaveBeenLastCalledWith("gin", false);
    await expect(args.onToggle).toHaveBeenCalledTimes(2);
  },
};

/** Wired to local state, the way the pantry screen wires it to the user's bar. */
export const Interactive: Story = {
  render: function InteractivePantryList(args) {
    const [ownedIds, setOwnedIds] = useState(args.ownedIds);

    function toggle(ingredientId: string, owned: boolean) {
      const next = new Set(ownedIds);
      if (owned) next.add(ingredientId);
      else next.delete(ingredientId);
      setOwnedIds(next);
      args.onToggle(ingredientId, owned);
    }

    return <PantryList {...args} ownedIds={ownedIds} onToggle={toggle} />;
  },
  play: async ({ canvas, userEvent }) => {
    const bourbon = await canvas.findByRole("button", { name: "Bourbon" });

    await userEvent.click(bourbon);
    await expect(bourbon).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(bourbon);
    await expect(bourbon).toHaveAttribute("aria-pressed", "false");
  },
};

/** The catalog has no ingredients yet. */
export const Empty: Story = {
  args: { ingredients: [], ownedIds: new Set<string>() },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(m.pantry_empty())).toBeVisible();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

/** The most used ingredients are offered first, in the order given, and stay in their category. */
export const WithPopular: Story = {
  args: {
    popularIds: ["lime-juice", "gin", "not-in-the-catalog"],
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("heading", { level: 2, name: m.pantry_popular() }),
    ).toBeVisible();

    const headings = canvas.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    await expect(headings[0]).toBe(m.pantry_popular());

    // An identifier the catalog does not know is skipped.
    const chips = canvas.getAllByRole("button").map((node) => node.textContent);
    await expect(chips.slice(0, 3)).toEqual(["Lime juice", "Gin", "Bourbon"]);
    await expect(canvas.getAllByRole("button", { name: "Gin" })).toHaveLength(2);
  },
};

/** Owning bourbon covers whiskey: the generic ingredient is outlined, with a word of explanation. */
export const WithImplied: Story = {
  args: {
    ingredients: [
      ...ingredients,
      { id: "whiskey", name: "Whiskey", category: "spirit", parentId: null },
    ],
    ownedIds: new Set(["bourbon"]),
    impliedIds: new Set(["whiskey"]),
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByText(m.pantry_implied_hint())).toBeVisible();
    await expect(canvas.getByText(m.pantry_selected({ count: 1 }))).toBeVisible();

    // Covered is not owned: the chip is still off and can be picked for itself.
    const whiskey = canvas.getByRole("button", { name: "Whiskey", pressed: false });
    await userEvent.click(whiskey);
    await expect(args.onToggle).toHaveBeenLastCalledWith("whiskey", true);
  },
};

/** The search ignores case and accents, and hides the "most used" group. */
export const Search: Story = {
  args: {
    popularIds: ["gin"],
  },
  play: async ({ canvas, userEvent }) => {
    const search = await canvas.findByLabelText(m.pantry_search());

    await userEvent.type(search, "RUM");
    await expect(canvas.getAllByRole("button").map((node) => node.textContent)).toEqual([
      "White rum",
    ]);
    await expect(
      canvas.queryByRole("heading", { name: m.pantry_popular() }),
    ).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "absinthe");
    await expect(canvas.getByText(m.pantry_no_result())).toBeVisible();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};
