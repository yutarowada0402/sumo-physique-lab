import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  workers: process.env.CI ? 2 : 1,
  use: {
    baseURL: "http://127.0.0.1:4173/sumo-physique-lab/",
    headless: true,
    channel: "chromium",
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/sumo-physique-lab/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 360, height: 780 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
