# 014 — CommonLocators Strategy

## 1. Problem This Pattern Solves

Some UI elements appear on **every page** of the application — the navigation bar, a persistent footer, a loading spinner, a toast notification region. Without a shared registry, every POM would define the same locators independently, leading to:

- Duplicate locator strings scattered across multiple files
- Inconsistent error messages for the same shared element  
- No single place to update when the selector changes in the app

---

## 2. The Three-Layer Solution

```
EventAppCommonLocators          ← locators + action methods for shared UI
        ↑ accessed via
EventAppPageManager             ← single getter, lazy-initialised instance
        ↑ injected into
EventAppHomePage / any POM      ← constructor receives pm, calls common actions
        ↑ used by
EventAppHomeFlow / any Flow     ← calls both common and page-specific methods via pm
```

---

## 3. Layer 1 — `EventAppCommonLocators`

### Location
`src/eventApp-pageObjects/eventApp-commonLocators.ts`

### What it holds
All locators and actions for UI elements that appear on **two or more pages**.

### Class structure

```typescript
export class EventAppCommonLocators extends HelperBase {

    // ── Private locators (consumers call methods, not raw locators) ───────────
    private readonly navBookings: Locator;
    private readonly navApiDocs:  Locator;

    constructor(page: Page) {
        super(page);
        this.navBookings = page.locator("//a[@id='nav-bookings']");
        this.navApiDocs  = page.getByText('API Docs');
    }

    // ── isAt — confirm shared chrome is present ───────────────────────────────
    async isAt(): Promise<void> {
        await this.safeExpectVisible(this.navBookings, 'COMMON LOCATORS ERROR: ...');
        await this.safeExpectVisible(this.navApiDocs,  'COMMON LOCATORS ERROR: ...');
    }

    // ── Click actions ─────────────────────────────────────────────────────────
    async clickNavBookings(): Promise<void> { ... }
    async clickNavApiDocs():  Promise<void> { ... }

    // ── Visibility assertions (throw UIError on failure) ─────────────────────
    async expectNavBookingsVisible(): Promise<void> { ... }
    async expectNavApiDocsVisible():  Promise<void> { ... }

    // ── Boolean checks (never throw — use for conditional logic only) ─────────
    async isNavBookingsVisible(): Promise<boolean> { ... }
    async isNavApiDocsVisible():  Promise<boolean> { ... }
}
```

### Action method naming convention

| Intent | Method type | Example |
|---|---|---|
| Navigate to a section | click | `clickNavBookings()` |
| Assert element is present | expectXxxVisible | `expectNavBookingsVisible()` |
| Conditional check | isXxxVisible | `isNavBookingsVisible()` |
| Enter text in shared input | fillXxx | `fillSearchBar(text)` |

### Why `private` locators?

Raw `Locator` properties expose implementation details and tempt callers to bypass the action methods. Keeping locators `private readonly` forces all consumers to go through the named method — which carries the correct error message and logging.

---

## 4. Layer 2 — `EventAppPageManager` Getter

### Location
`src/eventApp-pageObjects/eventApp-pageManager.ts`

### Pattern: lazy `??=` initialisation

```typescript
private commonLocators?: EventAppCommonLocators;

getEventAppCommonLocators(): EventAppCommonLocators {
    return this.commonLocators ??= new EventAppCommonLocators(this.page);
}
```

**Why lazy?**  
The manager holds one instance per class. The instance is created only when first requested — no wasted construction on pages a test never visits. Every subsequent call returns the same object.

**Rule:** Never call `new EventAppCommonLocators(page)` outside of this getter.

---

## 5. Layer 3 — POM Constructor Receives `pm`

When a Page Object's `isAt()` or any method needs to verify or interact with a **shared element**, inject `EventAppPageManager` into its constructor.

```typescript
export class EventAppHomePage extends HelperBase {

    private readonly pm: EventAppPageManager;   // ← reference to the manager
    private readonly pageHeading: Locator;      // ← page-specific locator

    constructor(page: Page, pm: EventAppPageManager) {
        super(page);
        this.pm          = pm;
        this.pageHeading = page.getByText('Amazing Events');
    }

    async isAt(): Promise<void> {
        await this.page.waitForURL('**/dashboard**');
        // Verify shared nav via CommonLocators action method — no locator re-definition
        await this.pm.getEventAppCommonLocators().expectNavBookingsVisible();
    }

    async verifyHomepageLoaded(): Promise<void> {
        // Page-specific check using this class's own locator
        await this.safeExpectVisible(this.pageHeading, 'EVENTAPP HOME ERROR: ...');
    }
}
```

The `PageManager` getter creates the page with `this` (itself) as the second argument:

```typescript
getEventAppHomePage(): EventAppHomePage {
    return this.homePage ??= new EventAppHomePage(this.page, this);
    //                                                        ^^^^
    //                               pass the manager so the POM can reach CommonLocators
}
```

### When does a POM need `pm` injected?

| Situation | Needs `pm`? |
|---|---|
| `isAt()` checks a shared nav/chrome element | ✅ Yes |
| A page action clicks a shared element (e.g. nav link present on all pages) | ✅ Yes |
| All locators are 100% page-specific | ❌ No — simpler constructor `(page: Page)` is fine |

---

## 6. Layer 4 — Business Flows Use Both via `pm`

A business flow receives `pm` and can freely mix calls to **CommonLocators** and **page-specific POMs**:

```typescript
export class EventAppHomeFlow {

    private readonly pm: EventAppPageManager;

    constructor(pm: EventAppPageManager) {
        this.pm = pm;
    }

    async verifyHomepageLoaded(): Promise<string> {
        // ① Common chrome — via CommonLocators action method
        await this.pm.getEventAppCommonLocators().isAt();

        // ② Page-specific content — via POM method
        await this.pm.getEventAppHomePage().verifyHomepageLoaded();

        return this.pm.getPage().url();
    }

    async goToBookings(): Promise<void> {
        // ③ Shared navigation action — via CommonLocators
        await this.pm.getEventAppCommonLocators().clickNavBookings();

        // ④ Now on a different page — switch to its POM
        await this.pm.getEventAppBookingsPage().isAt();
    }
}
```

This is the **only** layer where both `CommonLocators` methods and POM methods are combined. POMs themselves do not call each other's methods (that would create tight coupling). Only flows orchestrate across multiple POMs.

---

## 7. Full Call Chain (annotated)

```
Test spec
  └── new EventAppHomeFlow(pm)
        ├── pm.getEventAppCommonLocators().isAt()
        │     └── EventAppCommonLocators.isAt()
        │           ├── safeExpectVisible(navBookings, ...)    ← HelperBase wrapper
        │           └── safeExpectVisible(navApiDocs, ...)     ← HelperBase wrapper
        │
        └── pm.getEventAppHomePage().verifyHomepageLoaded()
              └── EventAppHomePage.verifyHomepageLoaded()
                    └── safeExpectVisible(pageHeading, ...)    ← HelperBase wrapper
```

---

## 8. What Belongs in CommonLocators vs a POM

### Add to `EventAppCommonLocators` when:
- The element exists on **≥ 2 pages** (nav links, persistent header/footer, toast, spinner)
- The same click/fill/assert logic would otherwise be copy-pasted into multiple POMs
- It is part of the **application chrome** (things that don't change as you navigate)

### Keep in the POM when:
- The element only exists on **one specific page**
- The element is part of page-specific content (form fields, article lists, event cards)

### Quick checklist
```
[ ] Does this element appear on more than one page?   → CommonLocators
[ ] Is this the only page that has this element?       → POM
[ ] Is this a nav/header/footer item?                  → CommonLocators
[ ] Is this a form input or data table unique to a page? → POM
```

---

## 9. Circular Import Note

`EventAppHomePage` imports `EventAppPageManager`, and `EventAppPageManager` imports `EventAppHomePage`. This is a **mutual import**, not a true circular dependency problem in practice because:

1. TypeScript resolves module graphs at compile time without issues here — the type references are resolved correctly.
2. At runtime, the `??=` lazy initialisation in PageManager means neither class is instantiated during module loading — only when the getter is first called.

If you ever encounter a runtime `undefined` class reference, extract the type import using `import type { EventAppPageManager }` in the POM to break any potential initialisation-order issue.

---

## 10. Summary

| Layer | Class | Responsibility |
|---|---|---|
| Locators + actions | `EventAppCommonLocators` | Holds shared locators; exposes click/verify/isVisible methods |
| Registry | `EventAppPageManager` | Lazy getter — one instance per test run |
| Page contract | `EventAppHomePage` (and others) | Receives `pm`; calls CommonLocators methods in `isAt()` |
| Orchestration | `EventAppHomeFlow` (and others) | Calls both CommonLocators + POM methods via `pm` |
| Test | spec file | Calls flows only — never POMs or CommonLocators directly |
