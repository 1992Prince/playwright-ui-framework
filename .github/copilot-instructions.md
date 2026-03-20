# GitHub Copilot Instructions — `pw-ui-test-fw`

These rules define how Copilot should assist in this Playwright + TypeScript UI test automation framework. Always follow these conventions when generating, completing, or modifying code.

---

## 1. Language — TypeScript (Strict)

- **Always use TypeScript.** No plain JavaScript files.
- All class members, function parameters, and return types must be explicitly typed.
- Use `readonly` for locators and dependencies that are set in the constructor and never reassigned.
- Prefer `private readonly` for class-level fields unless wider visibility is explicitly required.
- Use `const` for all variables that are not reassigned.
- Avoid `any` type. Use specific types or generics. Only use `any` when catching errors (`catch (error: any)`).

```typescript
// ✅ Correct
private readonly submitButton: Locator;
async login(email: string, password: string): Promise<void> { ... }

// ❌ Wrong
submitButton: any;
async login(email, password) { ... }
```

---

## 2. Page Object Model (POM)

All page interaction classes live in `src/page-objects/` and **must** follow this structure:

### Rules
- Every POM **must extend `HelperBase`** from `src/page-objects/helperBase.ts`.
- Every POM **must implement the `isAt(): Promise<void>` abstract method** to verify the page is loaded.
- All locators are defined as `private readonly` properties and initialised in the constructor.
- Methods interact with UI only — **never add `expect()` assertions inside a POM**.
- Always use the safe wrappers from `HelperBase` instead of raw Playwright calls:
  - `safeClick(locator, errorMessage)` — never `locator.click()`
  - `safeFill(locator, value, errorMessage)` — never `locator.fill()`
  - `safeGetText(locator)` — never `locator.innerText()`
  - `safeExpectVisible(locator, errorMessage)` — never raw `expect(locator).toBeVisible()`

### Locator Priority (highest to lowest)
1. `data-testid` attribute: `page.locator('[data-testid="my-element"]')`
2. Semantic Playwright built-ins: `page.getByRole()`, `page.getByPlaceholder()`, `page.getByText()`
3. CSS selector: `page.locator('button[type="submit"]')`
4. XPath (last resort): `page.locator("//xpath/expression")`

### Error Message Convention
Error messages passed to `safeClick`/`safeFill` must follow the pattern:
```
'PAGE NAME ERROR: Descriptive action that failed'
```
Examples:
- `'LOGIN PAGE ERROR: Unable to click on Sign In link'`
- `'ARTICLE PAGE ERROR: Unable to enter article title'`

### POM Template
```typescript
import { Page, Locator } from '@playwright/test';
import { HelperBase } from './helperBase';

export class MyFeaturePage extends HelperBase {

    private readonly myButton: Locator;
    private readonly myInput: Locator;

    constructor(page: Page) {
        super(page);
        this.myButton = page.locator('[data-testid="my-button"]');
        this.myInput  = page.getByPlaceholder('Enter value');
    }

    async isAt(): Promise<void> {
        await this.page.waitForURL('**/my-feature**');
    }

    async clickMyButton(): Promise<void> {
        await this.safeClick(this.myButton, 'MY FEATURE PAGE ERROR: Unable to click My Button');
    }

    async fillMyInput(value: string): Promise<void> {
        await this.safeFill(this.myInput, value, 'MY FEATURE PAGE ERROR: Unable to fill My Input');
    }
}
```

---

## 3. PageManager — Single Entry Point

- **Never import and instantiate POM or Flow classes directly in test files.**
- Always access page objects and flows through `PageManager` (`src/page-objects/pageManager.ts`).
- Use lazy `??=` initialisation for all getters.
- When adding a new POM or Flow, add a corresponding getter to `PageManager`.

```typescript
// ✅ Correct
const pm = new PageManager(authenticatedPage);
const articleFlow = pm.getArticleFlow();
const loginPage   = pm.getConduitLoginPage();

// ❌ Wrong — instantiating directly in a test
const articlePage = new ConduitArticlePage(page);
```

### PageManager Getter Pattern
```typescript
private myFeaturePage?: MyFeaturePage;

getMyFeaturePage(): MyFeaturePage {
    return this.myFeaturePage ??= new MyFeaturePage(this.page);
}
```

---

## 4. Business Flows (Action Layer)

- Multi-step workflows that span more than one page go in `src/bussiness-flows/`.
- Flow classes receive a `PageManager` instance in their constructor — never a raw `Page`.
- Flows may use a **fluent builder pattern** (methods return `this`) for readability.
- Flows **must not** contain `expect()` assertions.
- For flows where state is accumulated (e.g., `ArticleFlow`), add a private `reset()` method and call it after the terminal action (`publish()`, `submit()`, etc.) to prevent state leakage between tests.

```typescript
// ✅ Fluent builder style
await pm.getArticleFlow()
    .withTitle('My Article')
    .withAbout('Description')
    .withContent('Body content')
    .withTags('playwright,typescript')
    .publish();
```

---

## 5. Fixtures — Authentication

- Tests that require a logged-in user must import `test` from `src/fixtures/auth.fixture.ts`, **not** from `@playwright/test`.
- Use the `authenticatedPage` fixture — it automatically logs in before the test and logs out after.
- Use the `config` fixture to access environment configuration inside `test.beforeAll`.

```typescript
// ✅ Correct imports for authenticated tests
import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
```

---

## 6. Spec File Conventions

### Naming
- Files must end in `.spec.ts`.
- Use kebab-case: `article.spec.ts`, `home.spec.ts`, `my-feature.spec.ts`.
- Local dev tests go in `src/tests/conduit/`.
- CI-targeted tests go in `src/tests/conduit-ci/`.

### Tags
Tags are embedded directly in the test title string with `@` prefix. Every test must have at least one tag.

| Tag | Purpose |
|---|---|
| `@sanity` | Critical path check |
| `@smoke` | Broader surface-area smoke |
| `@regression` | Full regression coverage |
| `@bvt` | Build Verification Test |

```typescript
test('Validate article creation @sanity', async ({ authenticatedPage }) => { ... });
```

### Standard Spec Structure
```typescript
import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { PageManager } from '../../page-objects/pageManager';
import { TestExecutionError } from '../../errors/testLevelGenericError';
import { consoleLogger } from '../../utils/consoleLoggerSingletonInstance';

test.beforeAll('run once before all tests', async ({ config }) => {
    consoleLogger.info('beforeAll: Opening Application=%s', config.Application);
    consoleLogger.debug('beforeAll: Env=%s', config.Env);
});

test('My test description @sanity', async ({ authenticatedPage }) => {
    consoleLogger.info('Start of test: My test description');
    const pm = new PageManager(authenticatedPage);

    let result: string;

    try {
        result = await pm.getMyFeatureFlow().performAction('value');
        consoleLogger.info('Action complete. result=%s', result);
    } catch (error: any) {
        consoleLogger.error('Action failed: %s', error.message);
        throw new TestExecutionError(`My action failed. Original error: ${error.message}`);
    }

    // Assertions outside try/catch — always
    expect(result).toBe('Expected Value');
    consoleLogger.info('End of test: My test description');
});
```

---

## 7. Error Handling Rules

### The Golden Rule
> **NEVER place `expect()` assertions inside a `try/catch` block.**

Wrapping assertions hides the real Playwright diff (e.g. `Expected 'foo' to equal 'bar'`) and replaces it with a vague message. Let assertion failures surface naturally.

### Error Class Usage

| Class | File | When to throw |
|---|---|---|
| `UIError` | `src/errors/uiError.ts` | Inside POM helpers for element-level failures (`safeClick`/`safeFill` already do this) |
| `TestExecutionError` | `src/errors/testLevelGenericError.ts` | In spec files and fixtures — wrap caught action errors and add context |

### Correct Pattern
```typescript
let tags: string[];

// ✅ Wrap action/flow calls
try {
    tags = await pm.getArticleFlow().getAllTagsList();
} catch (error: any) {
    consoleLogger.error('Failed to get tags: %s', error.message);
    throw new TestExecutionError(`Failed to retrieve tags. Original error: ${error.message}`);
}

// ✅ Assertions always outside try/catch
expect(tags.length).toBeGreaterThan(0);
expect(tags).toContain('Global');
```

---

## 8. Logging — Use the Singleton

- **Always import `consoleLogger` from `src/utils/consoleLoggerSingletonInstance.ts`.**
- Never instantiate `ConsoleLogger` directly (`new ConsoleLogger()` is forbidden outside the singleton file).
- Use `%s` placeholder syntax for string interpolation in log messages.

```typescript
import { consoleLogger } from '../../utils/consoleLoggerSingletonInstance';

consoleLogger.info('Test started: %s', testName);
consoleLogger.debug('Payload: %s', JSON.stringify(payload));
consoleLogger.warn('Retrying step due to flakiness');
consoleLogger.error('Failed: %s', error.message);
```

### Log Level Guide

| Level | When to use |
|---|---|
| `info` | Milestone events — test start/end, login, major action complete |
| `debug` | Diagnostic data — URLs, variable values, response bodies |
| `warn` | Non-fatal issues — retries, optional steps skipped |
| `error` | Failures immediately before re-throwing an error |

---

## 9. Constants — No Magic Strings

Never hardcode string literals directly in test or POM code. Use the constants files in `src/constants/`:

| File | Exported Constant | Use for |
|---|---|---|
| `timeout.constants.ts` | `TIMEOUTS` | `SHORT`, `MEDIUM`, `LONG`, `PAGE_LOAD` ms values |
| `ui.constants.ts` | `UI_STATES` | Element state strings (`visible`, `hidden`, etc.) |
| `env.constants.ts` | `ENVIRONMENTS` | Environment name strings (`dev`, `qa`, `stage`, `prod`) |
| `framework.constants.ts` | `FRAMEWORK` | Framework metadata (name, version) |
| `error.constants.ts` | `ERRORS` | Shared error message strings |

```typescript
// ✅ Correct
import { TIMEOUTS }  from '../constants/timeout.constants';
import { UI_STATES } from '../constants/ui.constants';

await locator.waitFor({ state: UI_STATES.VISIBLE });
await page.waitForTimeout(TIMEOUTS.MEDIUM);

// ❌ Wrong
await locator.waitFor({ state: 'visible' });
await page.waitForTimeout(5000);
```

---

## 10. Utility Reuse — Don't Rewrite Existing Logic

Before writing new helper logic, check if it already exists:

| Utility / Helper | Location | Reuse instead of... |
|---|---|---|
| `safeClick()` | `src/page-objects/helperBase.ts` | Writing raw `locator.click()` with manual waits |
| `safeFill()` | `src/page-objects/helperBase.ts` | Writing raw `locator.fill()` with manual waits |
| `safeGetText()` | `src/page-objects/helperBase.ts` | Writing `locator.innerText()` directly |
| `safeExpectVisible()` | `src/page-objects/helperBase.ts` | Writing `expect(locator).toBeVisible()` in a POM |
| `waitForNumberOfSeconds()` | `src/page-objects/helperBase.ts` | `page.waitForTimeout()` (use this sparingly — debugging only) |
| `consoleLogger` singleton | `src/utils/consoleLoggerSingletonInstance.ts` | `console.log()` / `console.error()` directly |
| `CommonLocators` | `src/page-objects/commonLocators.ts` | Re-defining shared locators (sign-in link, settings link, toast, spinner) |
| `config` object | `src/config/config.ts` | Hardcoding URLs or credentials |
| `TestExecutionError` | `src/errors/testLevelGenericError.ts` | Throwing a plain `new Error()` in test-level catch blocks |
| `UIError` | `src/errors/uiError.ts` | Throwing a plain `new Error()` in POM-level catch blocks |

---

## 11. CommonLocators — Shared UI Elements

Locators shared across multiple pages (navigation links, loaders, toasts) are in `src/page-objects/commonLocators.ts`. Inject `PageManager` into POM constructors that need them and call `pm.getCommonLocators()`.

```typescript
// ✅ Correct — use CommonLocators for shared elements
await this.safeClick(this.common.signInLink, 'LOGIN PAGE ERROR: Unable to click Sign In');

// ❌ Wrong — redefining a locator already in CommonLocators
this.signInLink = page.locator("//a[text()=' Sign in ']");
```

---

## 12. Global Setup / Teardown

- `src/setup/global-setup.ts` runs once before all tests and sets `process.env.RUN_ID`.
- `RUN_ID` is available in all tests and logs via `process.env.RUN_ID` or `config.runId`.
- Do not add per-test setup logic to global setup — use fixtures or `test.beforeAll` instead.
