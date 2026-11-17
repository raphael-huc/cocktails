import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { m } from "@/shared/i18n";
import { LoginForm } from "./LoginForm";

const meta = {
  title: "Modules/Auth/LoginForm",
  component: LoginForm,
  args: {
    onSubmit: fn(),
    googleUrl:
      "https://directus.example.com/auth/login/google?redirect=https%3A%2F%2Fcocktails.example.com%2Fauth%2Fcallback",
    pending: false,
    errorMessage: null,
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText(m.login_email()), "ada@example.com");
    await userEvent.type(canvas.getByLabelText(m.login_password()), "correct horse battery");
    await userEvent.click(canvas.getByRole("button", { name: m.login_submit() }));

    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "correct horse battery",
    });

    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: m.login_google() })).toHaveAttribute(
      "href",
      args.googleUrl,
    );
  },
};

/** Both fields are required: the browser blocks the submission before it reaches the app. */
export const SubmitBlockedWhenEmpty: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: m.login_submit() }));

    await expect(args.onSubmit).not.toHaveBeenCalled();
    await expect(canvas.getByLabelText(m.login_email())).toBeInvalid();
  },
};

/** While the credentials are being checked, the form cannot be sent a second time. */
export const Pending: Story = {
  args: {
    pending: true,
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = await canvas.findByRole("button", { name: m.login_submit() });

    await expect(submit).toBeDisabled();
    await userEvent.click(submit);
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/** Error state after a failed sign-in. */
export const WithError: Story = {
  args: {
    errorMessage: m.login_error_invalid(),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(m.login_error_invalid());
    await expect(canvas.getByRole("button", { name: m.login_submit() })).toBeEnabled();
  },
};
