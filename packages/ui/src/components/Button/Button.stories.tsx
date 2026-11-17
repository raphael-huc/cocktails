import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Button, buttonStyles } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Save changes", onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Save changes" });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    // The click left the focus on the button: it also answers to the keyboard.
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Large: Story = { args: { size: "lg" } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Save changes" });

    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Save changes" });

    await expect(button.offsetWidth).toBe(button.parentElement?.clientWidth);
  },
};

/** `buttonStyles` gives a link the appearance of a button without changing its role. */
export const AsLink: Story = {
  args: { variant: "secondary", children: "View details" },
  render: ({ variant, size, fullWidth, children }) => (
    <a href="#details" className={buttonStyles({ variant, size, fullWidth })}>
      {children}
    </a>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "View details" });

    await expect(link).toHaveAttribute("href", "#details");
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};
