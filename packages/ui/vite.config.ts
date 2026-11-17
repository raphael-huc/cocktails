import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Only used by Storybook: the library ships as source and is built by its consumers.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
