# Test Architecture — Internal Design Reference

This document explains the complete layered architecture of this Playwright + TypeScript
test framework. Every layer has a single responsibility. Read this before adding new POMs,
flows, fixtures, or tests.

---

## The Big Picture — Layers and Ownership

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 7 — SPEC FILES (tests)                                               │
│  What it does:  Import fixture. Create flow from pm. Call flow method.      │
│                 Write expect() assertions. Nothing else.                    │
│  Owns:          Business intent — "what" the test is verifying              │
│  Must NOT do:   new PageManager(), new LoginPage(), locator.click()         │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 6 — FIXTURES                                                         │
│  What it does:  Create PageManager, run login via AuthFlow, expose pm.      │
│                 Run logout in teardown (always, even on failure).            │
│  Owns:          Session lifecycle — setup and teardown per test              │
│  Must NOT do:   Call POM methods directly, hold test data                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 5 — BUSINESS FLOWS                                                   │
│  What it does:  Orchestrate multi-step user journeys across one or more     │
│                 pages. Uses PageManager to get POMs. Returns data for        │
│                 assertions.                                                  │
│  Owns:          "How" a business action is performed                        │
│  Must NOT do:   expect() assertions, accept raw Page, new POM directly      │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 4 — PAGE MANAGER                                                     │
│  What it does:  Single factory for all POMs. Lazy ??= initialisation.       │
│                 Returns the same POM instance if already created.           │
│  Owns:          POM lifecycle — create once, reuse everywhere               │
│  Must NOT do:   UI interactions, business logic                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — PAGE OBJECTS (POMs)                                              │
│  What it does:  Map one class to one app page/screen. Expose typed          │
│                 methods for every user action on that page.                 │
│  Owns:          UI interaction details — locators, clicks, fills, waits     │
│  Must NOT do:   expect() assertions, business logic, cross-page navigation  │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — COMMON LOCATORS                                                  │
│  What it does:  One class for locators that appear on multiple pages        │
│                 (nav links, toasts, spinners, user menus).                  │
│  Owns:          Shared UI element registry                                  │
│  Must NOT do:   Page-specific locators, business logic                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — HELPER BASE                                                      │
│  What it does:  Abstract base class all POMs extend. Safe wrappers for      │
│                 click, fill, getText, visibility checks. Enforces isAt().   │
│  Owns:          Defensive UI interaction primitives                         │
│  Must NOT do:   Business logic, assertions, page-specific locators          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — HelperBase (Abstract Base Class)

**File:** `src/page-objects/helperBase.ts`

Every POM extends `HelperBase`. It is the single place where all defensive Playwright
logic lives — waits, error wrapping, logging, screenshots.

### Why Abstract?

The `abstract isAt()` method forces every POM to declare how to verify its own page.
You cannot instantiate a POM without implementing this contract.

```typescript
// HelperBase enforces this contract on every POM
abstract isAt(): Promise<void>;
```

### Safe Wrappers — Write Once, Use Everywhere

| Method | What it does | Use instead of |
|---|---|---|
| `safeClick(locator, msg)` | Wait visible → scroll → check enabled → click | `locator.click()` |
| `safeFill(locator, value, msg, isPassword?)` | Wait visible → editable → clear → fill | `locator.fill()` |
| `safeGetText(locator)` | Wait visible → innerText | `locator.innerText()` |
| `safeExpectVisible(locator, msg)` | Assert visible, throw UIError on fail | raw `expect().toBeVisible()` in POM |
| `waitForVisible(locator, timeout?)` | Dynamic wait — resolves as soon as visible | `page.waitForTimeout()` |
| `waitForHidden(locator, timeout?)` | Dynamic wait — resolves when hidden/detached | hard sleep |
| `isVisible(locator)` | Boolean check, never throws | conditional visibility checks |
| `takeScreenshot(name?)` | Full-page screenshot saved to test-results/ | manual screenshot code |

### Design Principle

> Write the defensive logic once in HelperBase. All POMs inherit it automatically.
> Changing a safe wrapper updates the behaviour of every POM simultaneously.

---

## Layer 2 — CommonLocators

**File:** `src/page-objects/commonLocators.ts` (EventApp: create equivalent in `src/eventApp-pageObjects/`)

Some UI elements are not owned by a single page — navigation links, loading spinners,
toast notifications, user account menus. These go in `CommonLocators`.

### Why Separate?

If the nav link changes its selector, you update it in one place, not in every POM that uses it.

```typescript
// CommonLocators holds shared selectors
export class CommonLocators {
    readonly signInLink: Locator;
    readonly loadingSpinner: Locator;
    readonly toastMessage: Locator;

    constructor(page: Page) {
        this.signInLink    = page.locator('[data-testid="nav-signin"]');
        this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
        this.toastMessage  = page.locator('[data-testid="toast"]');
    }
}
```

POMs that need shared locators receive `PageManager` in their constructor and call
`pm.getCommonLocators()` — they never re-define what already exists.

---

## Layer 3 — Page Objects (POMs)

**EventApp files:** `src/eventApp-pageObjects/`

One class = one page or screen of the application.

### Pages to Create for EventApp

| POM Class | Page it maps to | Key methods |
|---|---|---|
| `EventAppLoginPage` | `/login` | `smartLogin()` |
| `EventAppHomePage` | `/` or `/home` | `verifyHomepageLoaded()`, `clickBrowseEvents()` |
| `EventAppEventsPage` | `/events` | `searchEvent()`, `clickEventCard()` |
| `EventAppEventDetailPage` | `/events/:id` | `getEventTitle()`, `clickBookNow()` |
| `EventAppOrdersPage` | `/orders` | `getOrderList()`, `clickOrder()` |
| `EventAppOrderDetailPage` | `/orders/:id` | `getOrderStatus()`, `clickCancelOrder()` |
| `EventAppCancelPage` | `/cancel` | `confirmCancellation()`, `getCancellationMessage()` |
| `EventAppPaymentPage` | `/payment` | `fillCardDetails()`, `clickPay()` |

### POM Rules

```typescript
// Every POM follows this exact structure
export class EventAppEventsPage extends HelperBase {

    // All locators: private readonly, defined in constructor
    private readonly searchInput: Locator;
    private readonly eventCard: Locator;

    constructor(page: Page) {
        super(page);
        this.searchInput = page.getByPlaceholder('Search events');
        this.eventCard   = page.locator('[data-testid="event-card"]');
    }

    // Contract method — verify this page is loaded
    async isAt(): Promise<void> {
        await this.page.waitForURL('**/events**');
    }

    // Methods use safe wrappers — never raw Playwright calls
    async searchForEvent(keyword: string): Promise<void> {
        await this.safeFill(this.searchInput, keyword,
            'EVENTS PAGE ERROR: Unable to fill search input');
    }

    async getFirstEventTitle(): Promise<string> {
        return this.safeGetText(this.eventCard.first());
    }

    // NO expect() here — assertions belong in spec files only
}
```

---

## Layer 4 — PageManager

**File:** `src/eventApp-pageObjects/eventApp-pageManager.ts`

Single entry point for all EventApp POMs. Lazy `??=` initialisation means a POM is
only created when first requested, and the same instance is returned on every subsequent call.

```typescript
export class EventAppPageManager {

    private readonly page: Page;

    // All POMs declared as optional — created only when first accessed
    private loginPage?:      EventAppLoginPage;
    private homePage?:       EventAppHomePage;
    private eventsPage?:     EventAppEventsPage;
    private ordersPage?:     EventAppOrdersPage;
    private paymentPage?:    EventAppPaymentPage;
    private cancelPage?:     EventAppCancelPage;

    constructor(page: Page) { this.page = page; }

    getPage(): Page { return this.page; }

    // Getters — lazy initialisation pattern
    getEventAppLoginPage():  EventAppLoginPage  { return this.loginPage  ??= new EventAppLoginPage(this.page);  }
    getEventAppHomePage():   EventAppHomePage   { return this.homePage   ??= new EventAppHomePage(this.page);   }
    getEventAppEventsPage(): EventAppEventsPage { return this.eventsPage ??= new EventAppEventsPage(this.page); }
    getEventAppOrdersPage(): EventAppOrdersPage { return this.ordersPage ??= new EventAppOrdersPage(this.page); }
    // ... add more as pages are built
}
```

### Why Lazy Initialisation?

- A test that only tests the homepage does not need `PaymentPage` in memory
- If `PaymentPage` constructor throws, tests that never use it are not affected
- Same POM instance is reused across the entire test — no state inconsistency

---

## Layer 5 — Business Flows

**Files:** `src/bussiness-flows/eventApp/`

Flows orchestrate multi-step user journeys. They receive `EventAppPageManager` in their
constructor and call POM methods through it. They never hold a raw `Page`.

### Flows to Create for EventApp

| Flow Class | File | Responsibility |
|---|---|---|
| `EventAppAuthFlow` | `eventApp-auth.flow.ts` | Login (smartLogin), Logout |
| `EventAppHomeFlow` | `eventApp-home.flow.ts` | Homepage verification, browse navigation |
| `EventAppEventFlow` | `eventApp-event.flow.ts` | Search event, view details, book ticket |
| `EventAppOrderFlow` | `eventApp-order.flow.ts` | View orders, get order status |
| `EventAppCancelFlow` | `eventApp-cancel.flow.ts` | Cancel order, verify cancellation |
| `EventAppPaymentFlow` | `eventApp-payment.flow.ts` | Fill payment, submit, get confirmation |

### Flow Structure Pattern

```typescript
export class EventAppEventFlow {

    private readonly pm: EventAppPageManager;

    constructor(pm: EventAppPageManager) {
        this.pm = pm;
    }

    // Returns data the test needs for assertions — no expect() inside flows
    async bookFirstAvailableEvent(): Promise<string> {
        consoleLogger.info('EventAppEventFlow.bookFirstAvailableEvent: Starting');

        // Calls POM methods via pm — never accesses page directly
        await this.pm.getEventAppHomePage().clickBrowseEvents();
        const eventTitle = await this.pm.getEventAppEventsPage().getFirstEventTitle();
        await this.pm.getEventAppEventsPage().clickEventCard(eventTitle);
        await this.pm.getEventAppEventDetailPage().clickBookNow();

        consoleLogger.info('EventAppEventFlow.bookFirstAvailableEvent: Complete. title=%s', eventTitle);
        return eventTitle;  // test uses this for expect()
    }
}
```

### Fluent Builder Pattern (for flows with accumulated state)

When a flow has multiple optional inputs (like an article or event creation form) use
the fluent builder pattern so tests read like plain English:

```typescript
await pm.getEventCreationFlow()
    .withTitle('Tech Conference 2026')
    .withDate('2026-06-01')
    .withVenue('Bangalore Convention Centre')
    .withCapacity(500)
    .publish();
```

The flow collects state via `withX()` methods that return `this`, then executes all
steps in the terminal `publish()` call. Always call `reset()` at the end of
`publish()` to prevent state leaking into the next test.

---

## Layer 6 — Fixtures

**File:** `src/fixtures/eventApp-auth.fixture.ts`

Fixtures are the bridge between infrastructure and tests. They own session lifecycle.

### What the Fixture Does

```
page (Playwright built-in)
  |
  v
new EventAppPageManager(page)   <-- ONE instance per test, created here
  |
  v
new EventAppAuthFlow(pm)
  |
  v
authFlow.loginAsValidUser(url, email, password)   <-- login via flow, not POM directly
  |
  v
await use(pm)   <-- pm handed to test
  |
  v
[test runs]
  |
  v
authFlow.logout()   <-- teardown, always runs even if test fails
```

### What the Fixture Exposes

```typescript
type EventAppFixtures = {
    eventAppPm: EventAppPageManager;   // tests use this to create flows
};
```

Only `eventAppPm` is exposed. The test never sees `page`, `authFlow`, or any POM.

### What Gets Logged in the Fixture

```
INFO  --- EventApp Fixture Setup ---
INFO  EventApp Fixture: url=... | email=... | runId=...
INFO  EventApp Fixture: Attempting login
INFO  EventApp Fixture: Login successful - providing pm to test
... test runs ...
INFO  --- EventApp Fixture Teardown ---
INFO  EventApp Fixture: Logout completed
INFO  --- EventApp Fixture Teardown Complete ---
```

---

## Layer 7 — Spec Files (Tests)

**Files:** `src/tests/eventApp/`

Tests are the simplest layer. They receive `eventAppPm` from the fixture, create the
flow they need, call one or two flow methods, then assert.

### What a Test Looks Like

```typescript
import { test } from '../../fixtures/eventApp-auth.fixture';
import { expect } from '@playwright/test';
import { EventAppEventFlow } from '../../bussiness-flows/eventApp/eventApp-event.flow';
import { TestExecutionError } from '../../errors/testLevelGenericError';
import { consoleLogger } from '../../utils/logger';

test.beforeAll('Suite setup', async () => {
    consoleLogger.info('beforeAll: EventApp event booking suite. runId=%s', process.env.RUN_ID);
});

test('User can book first available event @sanity', async ({ eventAppPm }) => {
    consoleLogger.info('Start of test: User can book first available event');

    // Step 1: Create the flow you need — pass pm, never instantiate POMs
    const eventFlow = new EventAppEventFlow(eventAppPm);

    // Step 2: Call flow method inside try/catch
    let bookedTitle: string;
    try {
        bookedTitle = await eventFlow.bookFirstAvailableEvent();
        consoleLogger.info('Event booked. title=%s', bookedTitle);
    } catch (error: any) {
        consoleLogger.error('Booking failed. error=%s', error.message);
        throw new TestExecutionError(`Event booking failed. Original error: ${error.message}`);
    }

    // Step 3: Assertions always outside try/catch
    expect(bookedTitle).toBeTruthy();
    expect(bookedTitle.length).toBeGreaterThan(0);

    consoleLogger.info('End of test: User can book first available event');
});
```

### Test Rules — What a Test Must and Must Not Do

| Must do | Must NOT do |
|---|---|
| Destructure `eventAppPm` from fixture | `new EventAppPageManager(page)` |
| `new EventAppXxxFlow(eventAppPm)` | `new EventAppLoginPage(page)` |
| Call flow methods only | `eventAppPm.getEventAppHomePage().click...()` |
| `expect()` only outside try/catch | `expect()` inside a catch block |
| `throw new TestExecutionError(...)` in catch | `throw new Error(...)` in catch |
| `consoleLogger.info/debug/warn/error` | `console.log()` |

---

## Execution Order — What Runs When

```
1. GLOBAL SETUP (once per full test run)
   src/setup/global-setup.ts
   - Sets process.env.RUN_ID
   - Logs "Test run started" with RUN_ID

2. PLAYWRIGHT CONFIG (once per run)
   playwright.config.ts
   - Reads project definitions (eventapp, conduit etc.)
   - Sets workers, timeout, reporter, globalSetup path

3. TEST FILE DISCOVERY
   - Playwright scans testDir for *.spec.ts matching project testMatch

4. FOR EACH TEST — FIXTURE SETUP
   eventApp-auth.fixture.ts: eventAppPm fixture
   - Creates new EventAppPageManager(page)     <-- ONE pm per test
   - Creates new EventAppAuthFlow(pm)
   - authFlow.loginAsValidUser(url, email, pw)  <-- login happens here
   - await use(pm)                              <-- test starts

5. TEST BODY RUNS
   - test creates flow:  new EventAppXxxFlow(eventAppPm)
   - test calls flow:    flow.someMethod()
   - flow gets POM:      pm.getEventAppXxxPage()  (lazy, created once)
   - POM interacts:      safeClick / safeFill (via HelperBase)
   - flow returns data
   - test asserts:       expect(data).toBe(...)

6. FOR EACH TEST — FIXTURE TEARDOWN
   - authFlow.logout()    <-- always runs, even if test failed
   - consoleLogger.info teardown complete

7. GLOBAL TEARDOWN (once per full test run)
   src/setup/global-teardown.ts
   - Final cleanup, report archival if needed
```

---

## Error Flow — What Happens When Something Fails

```
HelperBase.safeClick() throws
  |
  v
UIError("LOGIN PAGE ERROR: Unable to click...", originalError)
  |
  v
EventAppAuthFlow.loginAsValidUser() catches it
  |
  v
TestExecutionError("EventApp login failed. Original error: ...")
  |
  v
Fixture catches it, logs consoleLogger.error(...)
  |
  v
throw TestExecutionError("EventApp fixture setup failed. Original error: ...")
  |
  v
Playwright marks test as FAILED with full error chain visible in report
```

### Error Class Usage

| Class | Where to throw | Purpose |
|---|---|---|
| `UIError` | Inside HelperBase safe wrappers and POM catch blocks | Element-level failure with page context |
| `TestExecutionError` | In flows, fixtures, and spec catch blocks | Business-level failure with action context |

---

## Adding a New Page + Flow + Test — Checklist

```
1. POM
   [ ] Create src/eventApp-pageObjects/eventApp-<name>.page.ts
   [ ] Extend HelperBase
   [ ] Implement isAt()
   [ ] All locators: private readonly, set in constructor
   [ ] All methods use safeClick / safeFill / safeGetText
   [ ] No expect() anywhere in the POM

2. PageManager
   [ ] Import new POM class
   [ ] Add private field:   private xxxPage?: EventAppXxxPage;
   [ ] Add getter:          getEventAppXxxPage() { return this.xxxPage ??= new EventAppXxxPage(this.page); }

3. Business Flow
   [ ] Create src/bussiness-flows/eventApp/eventApp-<name>.flow.ts
   [ ] Constructor receives EventAppPageManager, stores as private readonly pm
   [ ] Methods call pm.getEventAppXxxPage().<method>()
   [ ] Methods return data (strings, arrays) — no expect() calls
   [ ] Use consoleLogger.info at start and end of each method

4. Test
   [ ] Import test from eventApp-auth.fixture (not @playwright/test)
   [ ] Destructure { eventAppPm } from fixture
   [ ] Create flow in test body: const myFlow = new EventAppXxxFlow(eventAppPm)
   [ ] Call flow method inside try/catch
   [ ] throw new TestExecutionError(...) in catch
   [ ] expect() assertions outside try/catch
   [ ] consoleLogger.info at start and end of test
```

---

## Dependency Map — Who Knows About Whom

```
spec file
  knows about:  EventAppXxxFlow, TestExecutionError, consoleLogger
  does NOT know: EventAppPageManager internals, any POM class, Locator, Page

business flow
  knows about:  EventAppPageManager (via constructor), consoleLogger, TestExecutionError
  does NOT know: Page, Locator, HelperBase, any POM class directly

PageManager
  knows about:  All POM classes
  does NOT know: Flows, fixtures, spec files

POM
  knows about:  HelperBase, Page, Locator, UIError, TIMEOUTS, UI_STATES, consoleLogger
  does NOT know: Flows, PageManager, fixtures, spec files

HelperBase
  knows about:  Page, Locator, UIError, TIMEOUTS, UI_STATES, consoleLogger
  does NOT know: Any POM, any flow, any fixture

fixture
  knows about:  EventAppPageManager, EventAppAuthFlow, TestExecutionError, consoleLogger, config
  does NOT know: Individual POMs, individual flows other than AuthFlow
```

This dependency direction is a strict one-way flow:
```
spec → flows → PageManager → POMs → HelperBase
```
No layer reaches back up to the layer above it.
