import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { m } from "@/shared/i18n";
import { NO_FILTER } from "../domain/cocktail";
import { CocktailFilters } from "./CocktailFilters";

const meta = {
  title: "Modules/Catalog/CocktailFilters",
  component: CocktailFilters,
  args: {
    categories: ["cocktail", "shot", "punch", "soft-drink"],
    filter: NO_FILTER,
    onChange: fn(),
  },
} satisfies Meta<typeof CocktailFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing chosen: "All" is the pressed category, classics are not required. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      await canvas.findByRole("group", { name: m.category_filter_label() }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: m.category_all(), pressed: true }),
    ).toBeVisible();
    // "Classics only", "All", and one chip per category.
    await expect(canvas.getAllByRole("button")).toHaveLength(6);

    await userEvent.click(canvas.getByRole("button", { name: m.cocktail_category_shot() }));
    await expect(args.onChange).toHaveBeenLastCalledWith({ ...NO_FILTER, category: "shot" });

    await userEvent.click(canvas.getByRole("button", { name: m.filter_classics() }));
    await expect(args.onChange).toHaveBeenLastCalledWith({ ...NO_FILTER, classicsOnly: true });
  },
};

/** Pressing the chosen category again, or "All", clears the category. */
export const WithSelection: Story = {
  args: { filter: { ...NO_FILTER, category: "shot" } },
  play: async ({ args, canvas, userEvent }) => {
    const shots = await canvas.findByRole("button", {
      name: m.cocktail_category_shot(),
      pressed: true,
    });
    const all = canvas.getByRole("button", { name: m.category_all(), pressed: false });

    await userEvent.click(shots);
    await expect(args.onChange).toHaveBeenLastCalledWith(NO_FILTER);

    await userEvent.click(all);
    await expect(args.onChange).toHaveBeenLastCalledWith(NO_FILTER);
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

/** With the search field, as on the page that lists every cocktail. */
export const WithSearch: Story = {
  args: { search: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText(m.catalog_search()), "s");

    await expect(args.onChange).toHaveBeenLastCalledWith({ ...NO_FILTER, search: "s" });
  },
};

/** Wired to local state: the criteria combine, one category at a time. */
export const Interactive: Story = {
  args: { search: true },
  render: function InteractiveCocktailFilters(args) {
    const [filter, setFilter] = useState(args.filter);
    return <CocktailFilters {...args} filter={filter} onChange={setFilter} />;
  },
  play: async ({ canvas, userEvent }) => {
    const all = await canvas.findByRole("button", { name: m.category_all() });
    const punches = canvas.getByRole("button", { name: m.cocktail_category_punch() });
    const classics = canvas.getByRole("button", { name: m.filter_classics() });
    const search = canvas.getByLabelText(m.catalog_search());

    await userEvent.click(punches);
    await userEvent.click(classics);
    await userEvent.type(search, "sour");

    await expect(punches).toHaveAttribute("aria-pressed", "true");
    await expect(classics).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    await expect(search).toHaveValue("sour");

    await userEvent.click(punches);
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(classics).toHaveAttribute("aria-pressed", "true");
  },
};

/** A single category leaves nothing to choose: only "Classics only" remains. */
export const SingleCategory: Story = {
  args: { categories: ["cocktail"] },
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByRole("button")).toHaveLength(1);
    await expect(canvas.getByRole("button", { name: m.filter_classics() })).toBeVisible();
  },
};
