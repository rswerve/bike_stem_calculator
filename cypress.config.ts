import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
      viewportWidth: 1920,
      viewportHeight: 1080,
    },
  },
});