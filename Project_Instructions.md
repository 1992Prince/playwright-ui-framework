# Project Instructions — `pw-ui-test-fw`

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Setup](#4-setup)
5. [Executing Tests](#5-executing-tests)
6. [Framework Architecture](#6-framework-architecture)
7. [Best Practices — Adding a New Test](#7-best-practices--adding-a-new-test)
8. [Error Handling Rules](#8-error-handling-rules)
9. [Logging](#9-logging)
10. [Reporting](#10-reporting)
11. [CI/CD](#11-cicd)

---

## 1. Project Overview

This is a **Playwright + TypeScript UI test automation framework** built for the [Conduit](https://conduit.bondaracademy.com/) real-world demo application. It demonstrates industry-standard practices and patterns including:

- **Page Object Model (POM)** — clean separation of UI elements from test logic.
- **Business Flow / Action Layer** — multi-step user workflows abstracted into reusable classes.
- **Page Manager Pattern** — single entry point for all page objects and flows; uses lazy initialization.
- **Custom Fixtures** — Playwright fixtures handle login/logout automatically, removing boilerplate from tests.
- **Custom Error Classes** — layered error handling with `UIError` (page-level) and `TestExecutionError` (test-level) for clear, debuggable failure output.
- **Structured Logging** — a singleton `consoleLogger` with `info`, `debug`, `warn`, and `error` levels.

---

## 2. Tech Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev/) | Test runner and browser automation |
| [TypeScript](https://www.typescriptlang.org/) | Typed language for all framework code |
| Node.js (v18+) | Runtime |
| GitHub Actions | CI/CD pipeline |

---

## 3. Folder Structure

```
pw-ui-test-fw/
│
├── playwright.config.ts          # Playwright config: projects, reporters, browser settings
├── package.json                  # NPM scripts and dependencies
├── Project_Instructions.md       # ← You are here
│
├── image/execution/              # Screenshots used in README/docs
├── playwright-report/            # Auto-generated HTML report (after each run)
├── test-results/                 # JSON report, screenshots, traces, videos
│
└── src/
    ├── tests/                    # ✅ SPEC FILES — assertions live here ONLY
    │   ├── conduit/              #    Tests for local development
    │   └── conduit-ci/           #    Tests for CI/CD environment
    │
    ├── page-objects/             # POM classes — UI element locators + interaction methods
    │   ├── helperBase.ts         #    Abstract base class all POMs extend
    │   ├── pageManager.ts        #    Single entry point for all POM and Flow instances
    │   ├── commonLocators.ts     #    Shared locators reused across pages
    │   ├── conduit-home.page.ts  #    Article/home page interactions
    │   └── conduit-login-logout.page.ts
    │
    ├── bussiness-flows/          # Action Layer — multi-step workflows across pages
    │   ├── article.flow.ts       #    Fluent builder: create, publish, delete articles
    │   └── auth.flow.ts          #    Login and logout orchestration
    │
    ├── fixtures/
    │   └── auth.fixture.ts       # Playwright fixture: auto login before / logout after test
    │
    ├── config/
    │   └── config.ts             # Environment-aware config (URL, credentials, run ID)
    │
    ├── constants/
    │   ├── timeout.constants.ts  # SHORT, MEDIUM, LONG, PAGE_LOAD values
    │   ├── ui.constants.ts       # Element state strings (visible, hidden, etc.)
    │   ├── env.constants.ts      # Environment name strings (dev, qa, stage, prod)
    │   ├── error.constants.ts    # Reusable error message strings
    │   └── framework.constants.ts# Framework metadata (name, version, author)
    │
    ├── errors/
    │   ├── uiError.ts            # Thrown by POM methods for element-level failures
    │   └── testLevelGenericError.ts # TestExecutionError — thrown in test/fixture code
    │
    ├── setup/
    │   ├── global-setup.ts       # Runs once before all tests; generates RUN_ID
    │   └── global-teardown.ts    # Runs once after all tests complete
    │
    └── utils/
        ├── consoleLogger.ts      # Structured logger class (info/debug/warn/error)
        └── consoleLoggerSingletonInstance.ts  # Pre-built singleton — import this in your files
```

### Key Principles

| Layer | Contains | Must NOT contain |
|---|---|---|
| `tests/` | `expect()` assertions, test orchestration | UI locators, raw Playwright actions |
| `page-objects/` | Locator definitions, interaction methods | `expect()` assertions |
| `bussiness-flows/` | Multi-step workflow logic | `expect()` assertions |
| `fixtures/` | Setup/teardown lifecycle logic | Test-specific assertions |

---

## 4. Setup

### Prerequisites

- [Node.js v18 or higher](https://nodejs.org/en/)
- An NPM client (`npm`, `pnpm`, or `yarn`)

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd pw-ui-test-fw

# 2. Install Node.js dependencies
npm install

# 3. Install Playwright browser binaries
npx playwright install
```

### Environment Configuration

All configuration is centralized in `src/config/config.ts`. Default **dev** credentials are hardcoded — no `.env` file is required for local runs.

To target a different environment, set the `TEST_ENV` variable before running:

```bash
# Run against QA environment
TEST_ENV=QA npx playwright test
```

| Variable | Default (dev) | Purpose |
|---|---|---|
| `TEST_ENV` | `dev` | Selects environment (dev / QA) |
| `API_URL` | `https://conduit.bondaracademy.com/` | Application base URL |
| `USER_EMAIL` | `testbondar1@gmail.com` | Test user login |
| `USER_PASSWORD` | `testbondar1` | Test user password |

---

## 5. Executing Tests

### Using NPM Scripts (Recommended)

```bash
# Run all @sanity tagged tests
npm run conduit-sanity

# Run all @sanity, @smoke, @regression, @bvt tagged tests
npm run conduit-bvt
```

### Direct Playwright Commands

```bash
# Run all tests (both projects)
npx playwright test

# Run a specific project
npx playwright test --project=conduit-local
npx playwright test --project=conduit-ci

# Run tests by tag
npx playwright test --grep "@sanity"
npx playwright test --grep "@smoke|@regression"

# Run a specific spec file
npx playwright test src/tests/conduit/article.spec.ts

# Run in headed mode (visible browser)
npx playwright test --headed

# Run in headless mode (CI default when process.env.CI is set)
npx playwright test --headless

# Run with a specific number of workers
npx playwright test --workers=4

# Run with retries
npx playwright test --retries=2

# Debug mode (opens Playwright Inspector)
npx playwright test --debug
```

### Available Test Tags

Attach tags inside the test title string. The `--grep` filter matches against this string.

| Tag | Intended Use |
|---|---|
| `@sanity` | Critical path, fast baseline check |
| `@smoke` | Broader surface-area smoke tests |
| `@regression` | Full regression coverage |
| `@bvt` | Build Verification Tests |

---

## 6. Framework Architecture

The framework follows a strict layered execution order:

```
npx playwright test
        │
        ▼
global-setup.ts          → Generates RUN_ID, runs once before all tests
        │
        ▼
playwright.config.ts     → Loads project config, assigns testDir per project
        │
        ▼
auth.fixture.ts          → Logs in before each test using AuthFlow
        │
        ▼
*.spec.ts                → Creates PageManager → calls Flows/POMs → asserts
        │
        ▼
global-teardown.ts       → Cleanup after all tests complete
```

### The Page Manager Pattern

Never instantiate POM or Flow classes directly in tests. Always use `PageManager`:

```typescript
const pm = new PageManager(authenticatedPage);

// ✅ Correct — use getters
const articleFlow = pm.getArticleFlow();
const loginPage   = pm.getConduitLoginPage();

// ❌ Wrong — do not import and new() directly in tests
const articlePage = new ConduitArticlePage(page);
```

`PageManager` uses lazy `??=` initialization — objects are only created when first accessed and are reused within the same test.

### The Fluent Builder Pattern (ArticleFlow)

Business flows support a fluent API for readable test code:

```typescript
await pm.getArticleFlow()
  .withTitle('My Article')
  .withAbout('A short description')
  .withContent('Full article body.')
  .withTags('playwright,typescript')
  .publish();
```

---

## 7. Best Practices — Adding a New Test

Follow these steps whenever you add a new feature or scenario.

### Step 1 — Create or Update a Page Object

If the page does not have a POM yet, create one in `src/page-objects/`.

```typescript
// src/page-objects/my-feature.page.ts
import { Page } from '@playwright/test';
import { HelperBase } from './helperBase';
import { UIError } from '../errors/uiError';

export class MyFeaturePage extends HelperBase {

  // Define locators as readonly properties
  private readonly myButton = this.page.locator('[data-testid="my-button"]');
  private readonly myInput  = this.page.locator('#my-input');

  constructor(page: Page) {
    super(page);
  }

  // Every POM must implement isAt()
  async isAt(): Promise<void> {
    await this.page.waitForURL('**/my-feature**');
  }

  // Use safeClick / safeFill from HelperBase — never raw .click()
  async clickMyButton(): Promise<void> {
    await this.safeClick(this.myButton, 'Failed to click My Button');
  }

  async fillMyInput(value: string): Promise<void> {
    await this.safeFill(this.myInput, value, 'Failed to fill My Input');
  }

  async getMyText(): Promise<string> {
    return await this.safeGetText(this.myButton);
  }
}
```

> **Rules for Page Objects:**
> - Extend `HelperBase` and implement `isAt()`.
> - Use `safeClick()`, `safeFill()`, `safeGetText()` instead of raw Playwright calls.
> - **No `expect()` assertions** — interactions only.
> - Throw `UIError` if you need custom error context beyond what `safeClick`/`safeFill` already provide.

### Step 2 — Register in PageManager

Add a getter to `src/page-objects/pageManager.ts`:

```typescript
import { MyFeaturePage } from './my-feature.page';

// Inside PageManager class:
private myFeaturePage?: MyFeaturePage;

getMyFeaturePage(): MyFeaturePage {
  return this.myFeaturePage ??= new MyFeaturePage(this.page);
}
```

### Step 3 — Create a Business Flow (if multi-step)

For workflows spanning multiple pages, add a flow class in `src/bussiness-flows/`:

```typescript
// src/bussiness-flows/my-feature.flow.ts
import { PageManager } from '../page-objects/pageManager';

export class MyFeatureFlow {

  private readonly myFeaturePage;

  constructor(pm: PageManager) {
    this.myFeaturePage = pm.getMyFeaturePage();
  }

  async performActionWorkflow(inputValue: string): Promise<void> {
    await this.myFeaturePage.clickMyButton();
    await this.myFeaturePage.fillMyInput(inputValue);
    // ... additional cross-page steps
  }
}
```

Then register it in `PageManager`:

```typescript
private myFeatureFlow?: MyFeatureFlow;

getMyFeatureFlow(): MyFeatureFlow {
  return this.myFeatureFlow ??= new MyFeatureFlow(this);
}
```

### Step 4 — Write the Spec File

Create `src/tests/conduit/my-feature.spec.ts` (or `conduit-ci/` for CI tests):

```typescript
import { test } from '../../fixtures/auth.fixture';
import { PageManager } from '../../page-objects/pageManager';
import { TestExecutionError } from '../../errors/testLevelGenericError';
import { consoleLogger } from '../../utils/consoleLoggerSingletonInstance';
import { expect } from '@playwright/test';

test.beforeAll('Setup', async ({ config }) => {
  consoleLogger.info('beforeAll: app=%s env=%s', config.Application, config.Env);
});

test('My feature works correctly @sanity', async ({ authenticatedPage }) => {
  consoleLogger.info('Start: My feature test');
  const pm = new PageManager(authenticatedPage);

  let result: string;

  // ✅ Wrap ACTION blocks in try/catch — add business context on failure
  try {
    await pm.getMyFeatureFlow().performActionWorkflow('some input');
    result = await pm.getMyFeaturePage().getMyText();
    consoleLogger.info('Action completed. result=%s', result);
  } catch (error: any) {
    consoleLogger.error('Action failed: %s', error.message);
    throw new TestExecutionError(`My feature action failed. Original error: ${error.message}`);
  }

  // ✅ Place all expect() calls OUTSIDE try/catch — let Playwright show the real diff
  expect(result).toBe('Expected Value');
  consoleLogger.info('End: My feature test');
});
```

### Step 5 — Use Constants, Not Magic Strings

```typescript
// ❌ Wrong
await locator.waitFor({ state: 'visible' });
await page.waitForTimeout(5000);

// ✅ Correct
import { TIMEOUTS }   from '../constants/timeout.constants';
import { UI_STATES }  from '../constants/ui.constants';

await locator.waitFor({ state: UI_STATES.VISIBLE });
await page.waitForTimeout(TIMEOUTS.MEDIUM);
```

---

## 8. Error Handling Rules

### The Golden Rule

> **NEVER wrap `expect()` inside a `try/catch` block.**

Wrapping assertions swallows the real error message (e.g., `Expected 'foo' to equal 'bar'`) and replaces it with a vague custom message in the Playwright report.

### Error Class Reference

| Class | Where to throw | Example context |
|---|---|---|
| `UIError` | Inside POM methods (`safeClick`, `safeFill` already do this) | Element not found, not clickable |
| `TestExecutionError` | In spec files and fixtures, wrapping caught errors | Business flow failed, login failed |

### Correct Pattern

```typescript
let data: string[];

// ✅ Actions wrapped — business context added
try {
  data = await pm.getArticleFlow().getAllTagsList();
} catch (error: any) {
  throw new TestExecutionError(
    `Failed to retrieve tag list. Original error: ${error.message}`
  );
}

// ✅ Assertions outside — Playwright captures the real failure
expect(data.length).toBeGreaterThan(0);
expect(data).toContain('Global');
```

---

## 9. Logging

Import the pre-built singleton logger — do **not** instantiate `ConsoleLogger` directly.

```typescript
import { consoleLogger } from '../utils/consoleLoggerSingletonInstance';

consoleLogger.info('User logged in successfully');
consoleLogger.debug('Request payload: %o', payload);
consoleLogger.warn('Retrying flaky step...');
consoleLogger.error('Login failed: %s', error.message);
```

Use log levels consistently:

| Level | When to use |
|---|---|
| `info` | Milestone events (test start/end, login, major action complete) |
| `debug` | Diagnostic details (URLs, payloads, variable values) |
| `warn` | Non-fatal anomalies (retries, skipped optional steps) |
| `error` | Failures before re-throwing an error |

---

## 10. Reporting

### HTML Report

An HTML report is automatically generated after every run into `playwright-report/`.

```bash
# Open the report in your browser
npx playwright show-report
```

### JSON Report

A machine-readable JSON report is written to `test-results/jsonReport.json` after every run. Useful for CI pipelines and dashboards.

### Traces, Videos, and Screenshots

Configured in `playwright.config.ts`:

| Artifact | Setting | Default behavior |
|---|---|---|
| Trace | `trace: 'on-first-retry'` | Captured only on first test retry |
| Video | `video: 'on'` | Recorded for every test |
| Screenshot | `screenshot: 'on'` | Captured for every test |

All artifacts are saved under `test-results/` and are attached to the HTML report.

---

## 11. CI/CD

The framework includes a pre-configured **GitHub Actions** workflow.

### Automatic Triggers

| Event | Action |
|---|---|
| Push to `main` / `master` | Full sanity suite runs |
| Pull Request to `main` / `master` | Full sanity suite runs |
| Nightly cron (`00:30 UTC` / `06:00 IST`) | Sanity suite monitors app health |

### CI Behaviour Differences

When `process.env.CI` is set (automatically by GitHub Actions), Playwright applies:
- `retries: 2` — failed tests are retried twice.
- `workers: 1` — tests run sequentially (prevents resource contention).
- `forbidOnly: true` — fails the build if `test.only` is accidentally committed.

Use `headless: true` in CI. Running headed mode without an XServer causes:
```
Looks like you launched a headed browser without having an XServer running.
```

### Artifacts

After each CI run, the following are uploaded as artifacts (retained for 30 days):
- `playwright-report/` — full HTML report
- `test-results/` — JSON report, screenshots, videos, traces

---

*Last updated: March 2026*
