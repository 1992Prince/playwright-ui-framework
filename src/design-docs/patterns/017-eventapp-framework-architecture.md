# 017 — EventApp Framework Architecture

> **Audience:** SDETs joining the project or working on the EventApp application area.
> **Scope:** Complete architectural overview — components, folder structure, interactions,
> and the full execution flow from `npx playwright test` to teardown.

---

## 1. Framework Introduction

This is a **scalable, layered Playwright + TypeScript UI test automation framework** built
on the Page Object Model (POM) pattern with a strict separation of concerns.

Key design goals:

| Goal | How it is achieved |
|---|---|
| **Scalable** | Each application area has its own isolated POM/flow/fixture set — adding a new app never touches existing code |
| **Maintainable** | Locators live only in POMs; assertions live only in spec files; no logic is duplicated |
| **Reliable** | All UI interactions go through `HelperBase` safe wrappers — explicit waits, scroll-into-view, enabled checks before every click/fill |
| **Readable** | Business flows expose english-language methods (`verifyHomepageLoaded`, `loginAsValidUser`) — tests read like a test plan |
| **CI-ready** | Config driven by environment variables with sensible dev defaults; `RUN_ID` links every log line across a run |
| **Debuggable** | Structured logger with timestamps and `RUN_ID` on every line; screenshots on failure; HTML + JSON reports generated automatically |

---

## 2. Folder Structure

```
playwright-ui-framework/
│
├── playwright.config.ts              # Central Playwright config — projects, reporters, global hooks
│
├── src/
│   ├── setup/
│   │   ├── global-setup.ts           # Runs ONCE before all tests — sets RUN_ID
│   │   └── global-teardown.ts        # Runs ONCE after all tests — logs run completion
│   │
│   ├── config/
│   │   └── config.ts                 # All env-dependent values (URLs, credentials, metadata)
│   │
│   ├── constants/
│   │   ├── timeout.constants.ts      # TIMEOUTS.SHORT / MEDIUM / LONG / PAGE_LOAD
│   │   ├── ui.constants.ts           # UI_STATES.VISIBLE / HIDDEN etc.
│   │   ├── env.constants.ts          # ENVIRONMENTS.DEV / QA / STAGE / PROD
│   │   ├── error.constants.ts        # Shared error message strings
│   │   └── framework.constants.ts    # Framework name and version metadata
│   │
│   ├── errors/
│   │   ├── uiError.ts                # Thrown by HelperBase / POMs for element-level failures
│   │   └── testLevelGenericError.ts  # Thrown in spec files / fixtures — wraps flow errors
│   │
│   ├── utils/
│   │   ├── logger.ts                 # ConsoleLogger class + exported singleton: consoleLogger
│   │   ├── consoleLoggerSingletonInstance.ts  # (legacy) re-exports consoleLogger
│   │   └── data-factory.ts           # getTestData() — reads JSON, caches at worker level
│   │
│   ├── page-objects/                 # Shared base — used by ALL application POMs
│   │   └── helperBase.ts             # Abstract base class: safeClick, safeFill, safeGetText, etc.
│   │
│   ├── eventApp-pageObjects/         # EventApp-specific POMs and manager
│   │   ├── eventApp-pageManager.ts   # Factory: lazy ??= getters for all EventApp POMs
│   │   ├── eventApp-commonLocators.ts# Shared nav/footer locators + action methods
│   │   ├── eventApp-login.page.ts    # Login page POM
│   │   ├── eventApp-home.page.ts     # Home/dashboard page POM
│   │   └── eventApp-eventDetails.page.ts  # Event detail page POM
│   │
│   ├── bussiness-flows/
│   │   └── eventApp/
│   │       ├── eventApp-auth.flow.ts  # loginAsValidUser(), logout()
│   │       └── eventApp-home.flow.ts  # verifyHomepageLoaded()
│   │
│   ├── fixtures/
│   │   └── eventApp-auth.fixture.ts   # Creates pm, runs login/logout, exposes eventAppPm
│   │
│   ├── testData/
│   │   └── eventApp-login.json        # Test data for eventApp-login.spec.ts
│   │
│   └── tests/
│       └── eventApp/
│           └── eventApp-login.spec.ts # Spec file — imports fixture test, writes assertions
│
└── test-results/
    ├── jsonReport.json                # Machine-readable test report
    └── screenshots/                   # Failure screenshots (generated at runtime)
```

---

## 3. Component Descriptions

### `playwright.config.ts`
The root configuration file read by Playwright before anything else runs.
- Declares **projects** — each project has a name and `testDir`. Running `--project=eventapp` tells Playwright to only pick up tests from `src/tests/eventApp/`.
- Registers `globalSetup` and `globalTeardown` hooks.
- Sets shared options: `headless`, `video`, `screenshot`, `trace`, retry policy.
- Registers reporters: HTML report (never auto-open) + JSON report.

### `global-setup.ts`
Runs **once** before any test starts, in the main process (not a worker).
- Generates a unique `RUN_ID` (format: `RUN_YYYYMMDD_HHMMSS_ms`).
- Sets `process.env.RUN_ID` so every log line across every worker carries the same run identifier.

### `global-teardown.ts`
Runs **once** after all tests finish.
- Logs run completion milestone with the same `RUN_ID`.
- Extension point for cleanup: deleting temp files, posting results to Slack, etc.

### `config.ts`
Single source of truth for environment-dependent runtime values.
- Reads `process.env.TEST_ENV` to determine which environment is active.
- Every field has a hardcoded dev default — no setup needed for local runs.
- CI overrides via environment variables in pipeline YAML.
- QA override block runs automatically when `TEST_ENV=QA`.
- Exposed as a fixture property (`config`) so `test.beforeAll` can log metadata.

### `constants/`
Named constants that eliminate magic strings and magic numbers from all other files.
- `TIMEOUTS` — numeric ms values used in `waitFor` calls.
- `UI_STATES` — element state strings (`'visible'`, `'hidden'`) used in locator waits.
- Never import raw strings like `'visible'` or `5000` directly — always use a constant.

### `errors/`
Two-level error hierarchy that preserves the original failure while adding context.

```
HelperBase (safeClick / safeFill fails)
    └── throws UIError("LOGIN PAGE ERROR: ...", originalError)
            └── Business Flow / Fixture catches it
                    └── throws TestExecutionError("Login attempt failed. Original error: ...")
```

- `UIError` — POM level. Wraps the raw Playwright error with a page-context message.
- `TestExecutionError` — Test/fixture level. Wraps a flow error with a test-context message.
- Raw `expect()` assertion errors are **never caught** — they surface as-is with full diff.

### `utils/logger.ts`
A `ConsoleLogger` class instantiated ONCE (module singleton) and exported as `consoleLogger`.
- Every log line carries `[timestamp] [RUN_ID=xxx] LEVEL:` prefix.
- Four levels: `info` (milestones), `debug` (variable values/URLs), `warn` (non-fatal), `error` (before re-throwing).
- Import: `import { consoleLogger } from '../../utils/logger'` — never `new ConsoleLogger()`.

### `utils/data-factory.ts`
Reads JSON test data files from `src/testData/` and caches them at worker level.
- Call `getTestData("fileName")` **once at module scope** (outside any test).
- First call reads from disk; all subsequent calls return the cached object — zero repeated I/O.
- One JSON file per spec file. Structure: top-level scenario keys → `inputs` + `expected`.

### `helperBase.ts`
Abstract base class that every POM extends. Contains all raw Playwright interaction logic.

| Method | What it does |
|---|---|
| `safeClick(locator, msg)` | Waits visible → scroll into view → assert enabled → click |
| `safeFill(locator, value, msg, isPassword?)` | Waits visible → assert editable → clear → fill (masks password in logs) |
| `safeGetText(locator)` | Waits visible → returns `innerText()` |
| `safeExpectVisible(locator, msg)` | `expect(locator).toBeVisible()` wrapped in UIError |
| `waitForVisible(locator, timeout?)` | Dynamic wait — resolves when visible, fails with UIError on timeout |
| `waitForHidden(locator, timeout?)` | Dynamic wait — resolves when hidden/detached |
| `isVisible(locator)` | Returns `boolean`, never throws — use for conditional logic only |
| `safeWaitForNavigation()` | Waits for `networkidle` after page transitions |
| `takeScreenshot(name?)` | Saves full-page screenshot to `test-results/screenshots/` |
| `waitForNumberOfSeconds(n)` | Hard sleep — debugging only, avoid in production tests |

Enforces `abstract isAt(): Promise<void>` — every POM must implement a page identity check.

### `eventApp-pageManager.ts`
Factory and registry for all EventApp POMs.
- Holds one `Page` reference (injected by the fixture).
- All POM getters use **lazy `??=` initialisation** — a POM is only instantiated when first requested.
- Passes `this` (the pm itself) to POMs that need to call `CommonLocators` in their `isAt()`.
- The only place where POM constructors are called — never in flows, never in tests.

### `eventApp-commonLocators.ts`
Registry of locators that appear on **multiple pages** (navigation bar, header, footer).
- Extends `HelperBase`.
- All locators are `private readonly` — callers use action methods, never raw locators.
- Exposes: `clickNavBookings()`, `expectNavBookingsVisible()`, `isNavBookingsVisible()` etc.
- `isAt()` verifies the shared chrome is visible — called from individual POM `isAt()` methods.

### EventApp POMs (`eventApp-*.page.ts`)
Each POM represents one page or significant page area.
- Extends `HelperBase`.
- All locators are `private readonly`, defined in the constructor.
- Methods interact with UI only — **no `expect()` assertions inside a POM**.
- `isAt()` verifies correct page identity (URL pattern + key element via CommonLocators).
- Receive data as method parameters — never import `config.ts`.

### Business Flows (`bussiness-flows/eventApp/`)
Multi-step workflows that orchestrate one or more POMs.
- Receive `EventAppPageManager` in the constructor — never a raw `Page`.
- Call POM methods via `this.pm.getEventApp...Page().method()`.
- Return plain data (strings, arrays, objects) for tests to assert on.
- No `expect()` assertions — flows produce data, tests own assertions.

### `eventApp-auth.fixture.ts`
The boundary between Playwright's test runner and the framework.
- Creates **ONE** `EventAppPageManager` per test.
- Runs `EventAppAuthFlow.loginAsValidUser()` in setup.
- Exposes `eventAppPm` to the test via `await use(pm)`.
- Runs `authFlow.logout()` in teardown (try/catch — non-fatal).
- Also exposes `config` fixture property for `beforeAll` logging.

### Spec Files (`tests/eventApp/`)
The only layer that owns `expect()` assertions.
- Import `test` from the fixture file, not from `@playwright/test`.
- Receive `{ eventAppPm }` from fixture — never instantiate POMs or PageManager.
- Create business flow objects: `new EventAppHomeFlow(eventAppPm)`.
- Call flow methods inside `try/catch`, throw `TestExecutionError` on failure.
- `expect()` assertions always **outside** `try/catch`.
- Load test data at module scope: `const loginData = getTestData("eventApp-login")`.

---

## 4. Component Interaction Map

```
playwright.config.ts
    │
    ├──► global-setup.ts          (once, before all tests)
    │        └── sets RUN_ID
    │
    ├──► [Worker Process starts]
    │        │
    │        ├── config.ts loads  (once per worker, module-level)
    │        │       └── reads process.env.*
    │        │
    │        ├── data-factory.ts loads (once per worker, module-level call in spec)
    │        │       └── reads testData/eventApp-login.json → cache
    │        │
    │        └── eventApp-auth.fixture  (once per TEST — setup + teardown)
    │                │
    │                ├── new EventAppPageManager(page)
    │                │       └── lazy getters for all POMs
    │                │
    │                ├── new EventAppAuthFlow(pm)
    │                │       └── pm.getEventAppLoginPage().smartLogin(url, email, pass)
    │                │               └── HelperBase.safeFill / safeClick
    │                │
    │                ├── await use(pm)  ──────────────────────────────────────────────┐
    │                │                                                                │
    │                └── teardown: authFlow.logout()                    TEST BODY ◄──┘
    │                                                                       │
    │                                                            new EventAppHomeFlow(pm)
    │                                                                       │
    │                                                            homeFlow.verifyHomepageLoaded()
    │                                                                       │
    │                                                            ┌──────────┴───────────┐
    │                                                            │                      │
    │                                                  pm.getCommonLocators()  pm.getHomePage()
    │                                                  .isAt()                 .verifyHomepageLoaded()
    │                                                  (nav bar check)         (page heading check)
    │                                                            │
    │                                                  HelperBase.safeExpectVisible()
    │                                                            │
    │                                               returns currentUrl: string
    │                                                            │
    │                                               expect(currentUrl).toContain(...)  ← assertion
    │
    └──► global-teardown.ts       (once, after all tests)
             └── logs RUN_ID completion
```

---

## 5. Full Execution Flow — `npx playwright test --project=eventapp`

```
Step  Who                        What happens
────  ─────────────────────────  ──────────────────────────────────────────────────────────

 1.   CLI                        Playwright reads playwright.config.ts
                                 Resolves project 'eventapp' → testDir = src/tests/eventApp

 2.   global-setup.ts            Runs ONCE in main process (before any worker starts)
                                 Generates RUN_ID = "RUN_20260322_143022_456"
                                 Sets process.env.RUN_ID

 3.   Worker Process             Playwright spawns a worker process
                                 Worker imports eventApp-login.spec.ts module

 4.   Module-level code          config.ts evaluates (reads process.env.TEST_ENV → 'dev')
      (runs once per worker)     getTestData("eventApp-login") runs:
                                   → reads src/testData/eventApp-login.json
                                   → parses JSON, stores in cache
                                   → logs: DATA-FACTORY: Loaded and cached

 5.   test.beforeAll()           consoleLogger.info: EventApp login suite starting
                                 consoleLogger.info: Application=EventApp-Bookings
                                 consoleLogger.info: RUN-ID=RUN_20260322_...

 6.   Fixture setup              eventApp-auth.fixture.ts runs for first test:
      (per test)                   new EventAppPageManager(page)  ← ONE instance
                                   new EventAppAuthFlow(pm)
                                   authFlow.loginAsValidUser(url, email, pass)
                                     → pm.getEventAppLoginPage()  ← lazy creation
                                     → smartLogin():
                                         page.goto(url)
                                         safeFill(emailInput, email)
                                         safeFill(passwordInput, pass, isPassword=true)
                                         safeClick(loginButton)
                                   await use(pm)  ← hands pm to test body

 7.   Test body runs             const homeFlow = new EventAppHomeFlow(eventAppPm)
                                 homeFlow.verifyHomepageLoaded():
                                   pm.getEventAppCommonLocators().isAt()
                                     → safeExpectVisible(navBookings)
                                     → safeExpectVisible(navApiDocs)
                                   pm.getEventAppHomePage().verifyHomepageLoaded()
                                     → isAt(): waitForURL('**/dashboard**')
                                     →         expectNavBookingsVisible()
                                     → safeExpectVisible(pageHeading)
                                   returns page.url()

 8.   Assertions                 expect(currentUrl).toContain('eventhub.rahulshettyacademy.com')
      (outside try/catch)        ← if this fails, Playwright shows full diff in report

 9.   Fixture teardown           authFlow.logout() runs in try/catch
      (always runs)              warning logged if logout fails (non-fatal)

10.   Next test runs             Steps 6–9 repeat for each test
      (steps 6–9 repeat)        pageManager is recreated fresh per test — clean state

11.   global-teardown.ts         Runs ONCE after all workers finish
                                 Logs: GlobalTeardown: Test run finished. RUN_ID=...

12.   Reports generated          HTML report → playwright-report/index.html
                                 JSON report → test-results/jsonReport.json
                                 Screenshots → test-results/screenshots/ (if captured)
```

---

## 6. Data Flow Diagram

```
   env vars / CI secrets
          │
          ▼
      config.ts   ──────────────────────────► fixture (uses URL, email, pass)
                                                   │
   testData JSON                                   │
          │                                        │
          ▼                                        │
   data-factory cache                              ▼
          │                             EventAppPageManager (1 per test)
          │                                        │
          ▼                              ┌─────────┼─────────┐
     spec file                 LoginPage │  HomePage│  CommonLocators
          │                             │          │
          │  creates                    └──── HelperBase
          ▼                                  (safe wrappers)
   Business Flow ──── calls POMs via pm ────────────┘
          │
          │  returns plain data
          ▼
     spec file
          │
          ▼
      expect() assertions
```

---

## 7. Error Chain

```
HelperBase.safeClick() fails
    └── throws UIError("LOGIN PAGE ERROR: Unable to click login button", rootCause)

EventAppAuthFlow.loginAsValidUser() catches it
    └── throws TestExecutionError("Login failed. Original error: LOGIN PAGE ERROR: ...")

Fixture catch block
    └── throws TestExecutionError("Failed to Login. Original error: ...")

Playwright marks test as FAILED
    └── full stack trace in HTML report under that test
```

`expect()` assertion failures are **never caught** — they surface directly with the
expected vs received diff that Playwright renders in the HTML report.

---

## 8. Key Rules Summary

| Rule | Reason |
|---|---|
| Never `new EventAppHomePage()` in a test or flow | Use `pm.getEventAppHomePage()` — ensures one instance |
| Never `import config` in a POM or flow | Data flows downward as method parameters — POMs must not know the environment |
| Never `expect()` inside a POM or flow | Assertions belong to the test layer only |
| Never `expect()` inside a `try/catch` in a test | Hides the real diff — let assertion failures surface naturally |
| Call `getTestData()` at module scope | Worker-level cache — avoids per-test disk reads |
| Create flows in the test body, not in the fixture | Fixture owns session lifecycle; business logic belongs to the test |
| All locators `private readonly` in POMs | Forces consumers to use action methods, not raw locators |

---

## 9. Adding a New EventApp Feature — Checklist

When a new feature (e.g. Bookings page) needs test coverage:

```
[ ] 1.  Create POM:          src/eventApp-pageObjects/eventApp-bookings.page.ts
        - extends HelperBase
        - constructor(page: Page, pm: EventAppPageManager)
        - private readonly locators in constructor
        - isAt(): waitForURL + pm.getEventAppCommonLocators().expectNavBookingsVisible()
        - Action methods: viewBooking(), cancelBooking() etc.

[ ] 2.  Register in PM:      eventApp-pageManager.ts
        - Add: private bookingsPage?: EventAppBookingsPage
        - Add: getEventAppBookingsPage(): EventAppBookingsPage {
                   return this.bookingsPage ??= new EventAppBookingsPage(this.page, this);
               }

[ ] 3.  Create flow:         src/bussiness-flows/eventApp/eventApp-bookings.flow.ts
        - constructor(pm: EventAppPageManager)
        - Method per scenario: getActiveBookings(), cancelLatestBooking() etc.
        - Returns data for assertions — no expect() calls

[ ] 4.  Create test data:    src/testData/eventApp-bookings.json
        - { "activeBooking": { "inputs": {...}, "expected": {...} } }

[ ] 5.  Create spec:         src/tests/eventApp/eventApp-bookings.spec.ts
        - import test from eventApp-auth.fixture
        - const bookingsData = getTestData("eventApp-bookings")  // module scope
        - test('...@sanity', async ({ eventAppPm }) => { ... })

[ ] 6.  Add CommonLocators if needed:
        - If new element appears on multiple pages, add to eventApp-commonLocators.ts
        - Add locator (private readonly) + action methods

[ ] 7.  Run: npx playwright test --project=eventapp
```

---

## 10. How to Update This Document (Prompt for AI Agent)

When the framework changes and this document needs updating, use this prompt:

```
I have made the following change to the framework:
[Describe what changed — e.g. "Added a new POM for the Bookings page",
"Added a getBookingCount() method to EventAppHomeFlow",
"Added a new fixture property: testDataManager"]

Please update src/design-docs/patterns/017-eventapp-framework-architecture.md to:
1. Reflect the new component in Section 2 (Folder Structure) if a new file was added
2. Add a description in Section 3 (Component Descriptions) if it is a new component type
3. Update the interaction map in Section 4 if the data/call flow changed
4. Update the execution flow in Section 5 if the runtime sequence changed
5. Update the checklist in Section 9 if the steps for adding a feature changed
6. Do NOT change unrelated sections
```
