import type { StorybookConfig } from "@storybook/react-vite";

// The application's vite.config.ts is picked up as is: `@` alias, Paraglide, Tailwind.
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
};

export default config;
