import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { m } from "@/shared/i18n";
import { LogoutButton } from "./LogoutButton";

// The auth repository is mocked in .storybook/preview.tsx: signing out never reaches Directus.
const meta = {
  title: "Modules/Auth/LogoutButton",
  component: LogoutButton,
  args: {
    onLoggedOut: fn(),
  },
} satisfies Meta<typeof LogoutButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = await canvas.findByRole("button", { name: m.auth_sign_out() });

    await expect(args.onLoggedOut).not.toHaveBeenCalled();
    await userEvent.click(button);

    // The owner is told once the session is closed, and the button is usable again.
    await waitFor(() => expect(args.onLoggedOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(button).toBeEnabled());
  },
};
