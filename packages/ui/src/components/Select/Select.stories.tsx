import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Select } from "./Select";

const meta = {
  title: "Components/Select",
  component: Select,
  args: {
    label: "Language",
    value: "en",
    onValueChange: fn(),
    options: [
      { value: "en", label: "English" },
      { value: "fr", label: "Français" },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    // The label is tied to the control: it is how the field is found.
    const select = canvas.getByLabelText("Language");
    await expect(select).toHaveValue("en");

    await userEvent.selectOptions(select, "fr");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("fr");
  },
};

/** The label stays available to assistive technologies when it is not shown. */
export const HiddenLabel: Story = {
  args: { hideLabel: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Language")).toBeVisible();
  },
};

/** The select is controlled: it changes once its owner stores the new value. */
export const Interactive: Story = {
  render: function InteractiveSelect(args) {
    const [value, setValue] = useState(args.value);
    return <Select {...args} value={value} onValueChange={setValue} />;
  },
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByLabelText("Language");

    await userEvent.selectOptions(select, "fr");
    await expect(select).toHaveValue("fr");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Language")).toBeDisabled();
  },
};
