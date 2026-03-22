# HelperBase Design — Interview Reference

## 1. Why Does a BasePage / HelperBase Class Exist?

### The Problem Without It
In a raw Page Object Model every POM file repeats the same defensive boilerplate:

```typescript
// ❌ Duplicated across every POM without a base class
await locator.waitFor({ state: 'visible' });
await expect(locator).toBeEnabled();
await locator.click();
```

When this pattern needs to change (e.g., add scrollIntoView, add logging, change error type), you must update every POM individually. With 20 POMs that is 20 places to get wrong.

### What HelperBase Solves

| Concern | Without HelperBase | With HelperBase |
|---|---|---|
| Consistent waits | Each POM implements its own | Single source of truth in base class |
| Error wrapping | Raw Playwright errors surface | `UIError` with page context attached |
| Logging | Each POM logs differently (or not at all) | Uniform `consoleLogger` calls with class name prefix |
| Password safety | Any POM could accidentally log a password | `safeFill(isPassword=true)` masks at the base layer |
| Screenshot on failure | Not captured unless manually added | `takeScreenshot()` available to all POMs |

### Key Design Principle
> **"Write the defensive logic once, use it everywhere."**

HelperBase is not a utility class — it is the **contract** that all Page Objects sign. The `abstract isAt()` method enforces that every POM declares how to verify its own page identity.

---

## 2. Dynamic Waits vs Hard Sleeps

### Hard Sleep (anti-pattern)
```typescript
await page.waitForTimeout(3000); // Always waits 3 seconds, no matter what
```

**Problems:**
- **Slow**: even if the element appears in 200ms, you wait the full 3 s
- **Fragile**: on slow CI, 3 s may still not be enough
- **Unpredictable**: the number is an educated guess, not a guarantee
- **Maintenance debt**: every environment change requires re-tuning sleep values

### Dynamic Wait (correct approach)
```typescript
await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.LONG });
```

**Why it is better:**

| Property | Hard Sleep | Dynamic Wait |
|---|---|---|
| Resolves when | After fixed duration | As soon as condition is met |
| Speed | Always slow | Fast on fast machines, patient on slow ones |
| Failure signal | Proceeds even if element is not ready | Throws a `TimeoutError` immediately after deadline |
| Portability | Tied to one machine's speed | Works across local dev, CI, staging |

### The Rule of Thumb
> Use dynamic waits for **all** UI state transitions.  
> Use hard sleeps **only** as a last resort for unavoidable platform delays (e.g., animation that has no DOM signal).

---

## 3. HelperBase Method Reference

### Interaction Wrappers
| Method | Purpose | Key behaviour |
|---|---|---|
| `safeClick(locator, msg?)` | Click an element safely | waitFor visible → scrollIntoView → enabled check → click |
| `safeFill(locator, value, msg?, isPassword?)` | Fill an input field | waitFor visible → editable check → clear → fill; masks value in logs when `isPassword=true` |
| `safeGetText(locator)` | Read element text | waitFor visible → innerText |
| `safeExpectVisible(locator, msg)` | Assert element is visible | Wraps `expect().toBeVisible()` in `UIError` |

### Dynamic Wait Helpers
| Method | Purpose | Default timeout |
|---|---|---|
| `waitForVisible(locator, timeout?)` | Wait until element appears | `TIMEOUTS.LONG` (10 s) |
| `waitForHidden(locator, timeout?)` | Wait until element disappears | `TIMEOUTS.LONG` (10 s) |
| `isVisible(locator)` | Boolean visibility check — never throws | N/A |

### Navigation Helpers
| Method | Purpose |
|---|---|
| `safeWaitForNavigation()` | Waits for `networkidle` — use after navigation actions |
| `safeWaitForUrlContains(partial)` | Asserts URL matches a pattern |

### Diagnostic Helpers
| Method | Purpose |
|---|---|
| `takeScreenshot(name?)` | Saves full-page PNG to `test-results/screenshots/`. Returns path for `testInfo.attach()` in fixtures. |
| `waitForNumberOfSeconds(n)` | Hard wait — **debugging only**, never in production flows |

---

## 4. Error Hierarchy

```
UIError  ──────── thrown from: HelperBase methods (POM layer)
TestExecutionError ── thrown from: spec files and fixtures
```

Both log automatically in their constructors via `consoleLogger.error`, so every
failure appears in run output even if a catch block forgets to log before rethrowing.

---

## 5. Password Safety Contract

> **Never log credentials in plain text.**

`safeFill` accepts a fourth boolean parameter `isPassword`. When `true`, the logged value is replaced with `***`. The actual value is still passed to `locator.fill()` — only the log output is masked.

```typescript
// ✅ Correct — password masked in logs
await this.safeFill(this.passwordInput, password, 'Error msg', true);

// ❌ Wrong — password appears in CI logs
await this.safeFill(this.passwordInput, password, 'Error msg');
```

---

## 6. Screenshot Attachment Pattern

`takeScreenshot()` saves to disk and returns the path. To include it in the
Playwright HTML report, attach it in the fixture or spec catch block:

```typescript
// In a fixture or spec catch block
const screenshotPath = await pm.getSomePage().takeScreenshot('login-failed');
await testInfo.attach('failure-screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
});
```
