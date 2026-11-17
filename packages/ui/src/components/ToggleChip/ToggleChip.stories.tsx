import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { ToggleChip } from "./ToggleChip";

const meta = {
  title: "Components/ToggleChip",
  component: ToggleChip,
  args: { children: "Gin", pressed: false, onPressedChange: fn() },
} satisfies Meta<typeof ToggleChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "Gin", pressed: false });

    await userEvent.click(chip);
    await expect(args.onPressedChange).toHaveBeenCalledTimes(1);
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(true);
  },
};

export const On: Story = {
  args: { pressed: true },
  play: async ({ args, canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "Gin", pressed: true });

    await userEvent.click(chip);
    await expect(args.onPressedChange).toHaveBeenCalledTimes(1);
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(false);
  },
};

/** The chip is controlled: it only changes once its owner stores the new state. */
export const Interactive: Story = {
  render: function InteractiveToggleChip(args) {
    const [pressed, setPressed] = useState(false);
    return <ToggleChip {...args} pressed={pressed} onPressedChange={setPressed} />;
  },
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "Gin" });

    await userEvent.click(chip);
    await expect(chip).toHaveAttribute("aria-pressed", "true");

    await userEvent.keyboard(" ");
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "Gin" });

    await expect(chip).toBeDisabled();
    await userEvent.click(chip);
    await expect(args.onPressedChange).not.toHaveBeenCalled();
  },
};

/** Off, but already covered by another option: only the look changes, not the behaviour. */
export const Outlined: Story = {
  args: {
    children: "Whiskey",
    outlined: true,
  },
  play: async ({ args, canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "Whiskey", pressed: false });

    await userEvent.click(chip);
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(true);
  },
};
