import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);
const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  // Software WebGL is CPU-heavy; parallel 3D tests starve each other of frames.
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // The PWA service worker would show "works offline" toasts over the UI.
    serviceWorkers: 'block',
    launchOptions: {
      // Use a pre-installed Chromium when provided (e.g. in containers without downloads).
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      // Software WebGL so the 3D views render on machines without a GPU.
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], deviceScaleFactor: 1 },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
