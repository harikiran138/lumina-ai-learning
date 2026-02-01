import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: "e2e/cypress/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
  },
  viewportWidth: 1280,
  viewportHeight: 720,
});
