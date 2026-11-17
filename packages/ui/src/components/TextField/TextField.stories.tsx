import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { TextField } from "./TextField";

const meta = {
  title: "Components/TextField",
  component: TextField,
  args: { label: "Email", type: "email", placeholder: "you@example.com", onChange: fn() },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    // The label is tied to the input: it is how the field is found.
    const input = canvas.getByLabelText("Email");

    await userEvent.type(input, "ada@example.com");
    await expect(input).toHaveValue("ada@example.com");
    await expect(args.onChange).toHaveBeenCalled();
    await expect(input).not.toHaveAttribute("aria-invalid");
  },
};

export const WithError: Story = {
  args: { error: "Enter a valid email address.", defaultValue: "ada@example" },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Email");

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("Enter a valid email address.");
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "ada@example.com" },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText("Email");

    await expect(input).toBeDisabled();
    await userEvent.type(input, "new text");
    await expect(input).toHaveValue("ada@example.com");
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};
