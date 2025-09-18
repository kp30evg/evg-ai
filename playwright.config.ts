// playwright.config.ts
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

// Load E2E environment variables
require('dotenv').config({ path: '.env.e2e' });

export default defineConfig({
  testDir: './tests',
  
  // Global setup that signs in once and saves auth state
  // Commented out since we're using pre-saved auth state
  // globalSetup: './tests/global-setup.ts',
  
  // Timeout for each test
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for all tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Reuse authentication state from global setup
    storageState: 'storageState.json',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run local dev server before tests if not in CI
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev:test',
    port: 3001,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});