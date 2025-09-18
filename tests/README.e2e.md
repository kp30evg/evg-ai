# E2E Testing with Playwright

This guide explains how to set up and run end-to-end tests using Playwright with Clerk authentication.

## Prerequisites

1. **Clerk Dashboard Configuration** (Dev Instance Only)
   - Go to your [Clerk Dashboard](https://dashboard.clerk.com)
   - Select your **development** instance
   - Navigate to **User & Authentication** → **Email, Phone, Username**
   - Enable **Username** authentication
   - Enable **Password** authentication
   - Save changes

2. **Create Test User**
   - In Clerk Dashboard, go to **Users**
   - Click **Create user**
   - Set username: `e2e.user@evergreenos.dev`
   - Set password: `SuperStrong!Passw0rd`
   - Assign to your organization if needed

## Setup

1. **Copy environment file** (first time only):
   ```bash
   cp .env.e2e.example .env.e2e
   ```
   
2. **Update `.env.e2e`** with your test credentials if different from defaults

3. **Run setup**:
   ```bash
   npm run e2e:setup
   ```

## Running Tests

### Run all tests:
```bash
npm run e2e
```

### Run tests with UI mode (interactive):
```bash
npm run e2e:ui
```

### Debug tests:
```bash
npm run e2e:debug
```

## How It Works

1. **Global Setup** (`tests/global-setup.ts`)
   - Runs once before all tests
   - Signs in with test user credentials
   - Saves authentication state to `storageState.json`

2. **Test Execution**
   - Each test starts with saved authentication state
   - No need to sign in for each test
   - Fast and reliable

3. **Playwright MCP**
   - The saved `storageState.json` works with Playwright MCP
   - MCP sessions start already authenticated
   - No manual sign-in required

## File Structure

```
tests/
├── global-setup.ts       # Authentication setup
├── README.e2e.md        # This file
└── e2e/                 # Test files
    ├── dashboard.spec.ts
    ├── email.spec.ts
    └── chat.spec.ts
```

## Environment Variables

The `.env.e2e` file contains:
- `E2E_BASE_URL`: The URL of your local development server
- `E2E_CLERK_USER_USERNAME`: Test user's username
- `E2E_CLERK_USER_PASSWORD`: Test user's password

## Troubleshooting

### Authentication fails
1. Verify username/password auth is enabled in Clerk Dashboard
2. Check test user exists with correct credentials
3. Review `auth-setup-error.png` screenshot if present

### Tests can't find elements
1. Check selectors in `global-setup.ts` match your Clerk components
2. Verify sign-in page URL is correct
3. Ensure dev server is running

### Playwright MCP not authenticated
1. Run `npm run e2e:setup` to refresh authentication
2. Check `storageState.json` exists
3. Ensure Playwright MCP uses this project's config

## Security Notes

- **Never enable username/password in production** unless specifically needed
- Keep `.env.e2e` in `.gitignore`
- Use strong passwords even for test accounts
- Rotate test credentials periodically
- The `storageState.json` file contains auth tokens - don't commit it

## CI/CD Integration

For CI environments:
1. Set environment variables from secrets
2. Enable username/password auth in a dedicated test Clerk instance
3. Consider using a separate test organization

## Resources

- [Playwright Authentication Docs](https://playwright.dev/docs/auth)
- [Clerk Testing Guide](https://clerk.com/docs/testing/playwright/overview)
- [Clerk + Playwright Example](https://github.com/clerk/clerk-playwright-nextjs)