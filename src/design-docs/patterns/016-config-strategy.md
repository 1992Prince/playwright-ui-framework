# 016 — Config Strategy: Environment Configuration

> **Audience:** SDETs running tests locally or setting up CI pipelines.
> **Scope:** What `config.ts` does, how to override values, where to use it and where NOT to.

---

## 1. Purpose

`src/config/config.ts` is the **single source of truth for environment-dependent values**:
application URLs, login credentials, release metadata, and run identifiers.

It solves one problem: the same test suite must point to different backends
(`dev`, `qa`, `staging`) without any code change. You change the *environment*, not the tests.

```
┌──────────────────────────────────────────────────────────────┐
│                  config.ts at startup                        │
│                                                              │
│  1. Read  process.env.TEST_ENV  →  resolve 'dev' / 'qa'     │
│  2. Build config object with hardcoded dev defaults          │
│  3. If TEST_ENV=QA → overwrite URL / email / password        │
│  4. Export { config }                                        │
│                                                              │
│  Every env var has a hardcoded fallback so local dev works   │
│  with zero setup.                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Config Object — Fields Reference

```typescript
const config = {
  // Application endpoints
  appUrl:                  process.env.API_URL               || 'https://conduit.bondaracademy.com/',
  authTokenBaseUrl:        process.env.AUTH_TOKEN_BASE_URL   || 'https://dev-...auth0.com/oauth/token',
  authAutoInsuranceBaseUrl:process.env.AUTO_INSURANCE_BASE_URL|| 'https://...restdb.io/rest',

  // Credentials (dev defaults — overridden in CI via secrets)
  userEmail:    process.env.USER_EMAIL    || 'testbondar1@gmail.com',
  userPassword: process.env.USER_PASSWORD || 'testbondar1',
  dbPassword:   process.env.DB_PASSWORD   || 'password123',

  // Metadata (used in logs and reports)
  Release:          process.env.RELEASE          || '21.09',
  Application:      process.env.APPLICATION      || 'Conduit-API-UI',
  EventApplication: process.env.EVENTAPPLICATION || 'EventApp-Bookings',
  Env:              env,          // derived from TEST_ENV, always set

  // Injected by global-setup.ts — not available until tests start
  runId: process.env.RUN_ID
};
```

### Priority Rule

For every field the resolution order is:

```
CI / shell environment variable  >  hardcoded default in config.ts
```

If `process.env.USER_EMAIL` is set, the hardcoded value is ignored.
If it is not set, the hardcoded `dev` default is used.

---

## 3. How to Override Locally on Windows

### PowerShell (recommended for local dev)

Set an env var for a single run — does not persist after the terminal closes:

```powershell
# Run against QA environment, override email
$env:TEST_ENV = "QA"; $env:USER_EMAIL = "my-qa-user@test.com"; npx playwright test

# Override just the app URL
$env:API_URL = "https://staging.myapp.com"; npx playwright test

# Run a single spec against QA
$env:TEST_ENV = "QA"; npx playwright test tests/eventApp/eventApp-login.spec.ts --project=eventapp
```

### Inline in the npx command (CMD syntax)

```cmd
set TEST_ENV=QA && npx playwright test
set API_URL=https://staging.myapp.com && npx playwright test
```

### Persistent for the session (PowerShell)

```powershell
# Persists until the terminal is closed
$env:TEST_ENV = "QA"
$env:USER_EMAIL = "qa-user@test.com"
$env:USER_PASSWORD = "qa-pass"
npx playwright test
```

### What happens when TEST_ENV=QA

`config.ts` has a QA override block that runs automatically:

```typescript
if (env === 'QA') {
  config.appUrl     = process.env.API_URL       || 'https://qa-conduit-api.bondaracademy.com/api';
  config.userEmail  = process.env.USER_EMAIL    || 'qa-pwapiuser@test.com';
  config.userPassword = process.env.USER_PASSWORD || 'qa-Welcome';
}
```

You do not have to set all three — each still falls back to its QA default if omitted.

---

## 4. Passing Config Values from CI (GitHub Actions / Azure DevOps)

### GitHub Actions — via `env:` block

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      TEST_ENV:      QA
      API_URL:       ${{ secrets.QA_APP_URL }}
      USER_EMAIL:    ${{ secrets.QA_USER_EMAIL }}
      USER_PASSWORD: ${{ secrets.QA_USER_PASSWORD }}
      RELEASE:       ${{ github.run_number }}
      APPLICATION:   Conduit-API-UI
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test --project=conduit-ci
```

### Azure DevOps — via pipeline variables

```yaml
variables:
  TEST_ENV:      QA
  USER_EMAIL:    $(QA_USER_EMAIL)       # linked to a secret variable group
  USER_PASSWORD: $(QA_USER_PASSWORD)
  RELEASE:       $(Build.BuildNumber)

steps:
  - script: npx playwright test --project=conduit-ci
    displayName: Run Playwright Tests
```

### Key Security Rule

> **Never commit real passwords into `config.ts`.**
> Hardcoded defaults in `config.ts` are for DEV only — use throwaway or sandbox accounts.
> CI always injects real credentials via pipeline secrets / secret variable groups.

---

## 5. Where to Use Config — The Rule

### ✅ Use config in: Fixtures and `test.beforeAll()`

Config belongs in the **setup layer** — fixtures and `beforeAll` hooks.
This is where infrastructure decisions are made (which URL to open, which user to log in as).

**In a fixture:**
```typescript
import { config } from '../config/config';

// auth.fixture.ts
await authFlow.loginAsValidUser(
    config.userEmail,
    config.userPassword,
    config.appUrl
);
```

**In `test.beforeAll()` — for logging only:**
```typescript
// eventApp-login.spec.ts
test.beforeAll('EventApp suite setup', async ({ config }) => {
    consoleLogger.info('beforeAll: Opening Application=%s', config.EventApplication);
    consoleLogger.debug('beforeAll: Env=%s', config.Env);
    consoleLogger.info('RUN-ID=%s', process.env.RUN_ID);
});
```

Note: `config` is exposed as a fixture property — import `test` from your fixture file,
then destructure `{ config }` in `beforeAll`. It is already wired in both
`auth.fixture.ts` and `eventApp-auth.fixture.ts`.

---

## 6. Where NOT to Use Config — POMs and Business Flows

### ❌ Never import config in a POM

**Rule:** Page Objects receive data as **method parameters** — they never reach out to config.

**Why:**
- A POM's job is to interact with a single page. It should not know or care which environment it is on.
- If a POM imported config, you could not reuse it with a different URL without changing source code.
- Data flows **downward**: Test → Business Flow → POM. Config lives at the top; POMs are at the bottom.

```
Test (knows config, owns assertions)
  │
  ▼
Business Flow (receives pm, calls POMs, returns data)
  │
  ▼
POM (receives locator values as parameters, clicks/fills/reads)
  │
  ▼
HelperBase (safe Playwright wrappers)
```

**Correct pattern — data passes as parameters:**
```typescript
// ✅ Business Flow reads from fixture/config, passes into POM method
async loginAsValidUser(url: string, email: string, password: string): Promise<void> {
    await this.pm.getEventAppLoginPage().smartLogin(url, email, password);
}

// ✅ POM method just uses what it receives — no config import
async smartLogin(url: string, email: string, password: string): Promise<void> {
    await this.page.goto(url);
    await this.safeFill(this.emailInput, email, 'LOGIN PAGE ERROR: ...');
    await this.safeFill(this.passwordInput, password, 'LOGIN PAGE ERROR: ...');
    await this.safeClick(this.loginButton, 'LOGIN PAGE ERROR: ...');
}
```

```typescript
// ❌ Wrong — POM importing config directly
import { config } from '../config/config';   // NEVER do this in a POM

async login(): Promise<void> {
    await this.page.goto(config.appUrl);     // POM should not know appUrl
    await this.safeFill(this.email, config.userEmail, '...');
}
```

### ❌ Never import config in a Business Flow

Same reason — flows receive a `PageManager` and delegate to POMs.
Credentials and URLs are passed **into** the flow from the fixture, not read inside the flow.

---

## 7. Fixture: How `config` Is Exposed to Tests

Both `auth.fixture.ts` and `eventApp-auth.fixture.ts` declare `config` as a fixture property:

```typescript
type EventAppFixtures = {
    eventAppPm: EventAppPageManager;
    config: typeof config;           // ← exposed here
};

export const test = base.extend<EventAppFixtures>({
    config: async ({}, use) => {
        await use(config);           // ← passes the imported config object
    },
    // ...
});
```

Tests access it only for **logging and informational purposes** in `beforeAll`:

```typescript
// eventApp-login.spec.ts
test.beforeAll('suite setup', async ({ config }) => {
    consoleLogger.info('Application=%s | Env=%s', config.EventApplication, config.Env);
    consoleLogger.info('RUN-ID=%s', process.env.RUN_ID);
    // config.appUrl, config.userEmail etc. are NOT needed here —
    // the fixture already used them to log in before beforeAll runs
});
```

---

## 8. Quick Reference

| Scenario | What to do |
|---|---|
| Run locally with dev defaults | `npx playwright test` — no setup needed |
| Run locally against QA | `$env:TEST_ENV="QA"; npx playwright test` |
| Override one URL locally | `$env:API_URL="https://..."; npx playwright test` |
| CI — inject secrets | Set env vars in pipeline YAML, never in code |
| Log app name in beforeAll | `config.EventApplication`, `config.Application` |
| Log environment in beforeAll | `config.Env` |
| Use URL in a POM | ❌ — pass it as a method parameter from the flow |
| Use email/password in a POM | ❌ — pass them as parameters from the fixture/flow |
| Import config in a business flow | ❌ — receive data from fixture as constructor/method params |
