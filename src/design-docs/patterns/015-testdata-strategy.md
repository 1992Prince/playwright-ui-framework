# 015 — Test Data Strategy: JSON Files + Data Factory

> **Audience:** SDETs adding or maintaining test data in this framework.
> **Scope:** How test data is stored, loaded, cached, and consumed in spec files.

---

## 1. Overview

Test data (input values, expected outputs, credentials) is stored in **plain JSON files** and
loaded via a single utility — `src/utils/data-factory.ts`.

The utility reads a JSON file **once per Playwright worker process**, stores it in a
module-level `Map` (cache), and returns the cached object for every subsequent call.
This means **disk I/O happens at most once per file per worker**, no matter how many tests
use the same data.

```
┌─────────────────────────────────────────────────────────┐
│                    Worker Process                        │
│                                                          │
│  Spec Module Load                                        │
│  ──────────────────                                      │
│  const loginData = getTestData("login")  ← ONE disk read │
│                          │                               │
│                    ┌─────▼──────┐                        │
│                    │   cache    │  Map<string, object>   │
│                    └─────┬──────┘                        │
│                          │                               │
│  test 1 ─────────────────┤                               │
│  test 2 ─────────────────┤ ← all tests share the same   │
│  test 3 ─────────────────┘   cached object (zero I/O)   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. The Data Factory Utility

**File:** `src/utils/data-factory.ts`

```typescript
import fs from "fs";
import path from "path";
import { consoleLogger } from "./logger";

const cache = new Map<string, any>();

export function getTestData(fileName: string): any {
  // Cache hit — return immediately, no disk access
  if (cache.has(fileName)) {
    consoleLogger.debug('DATA-FACTORY: Cache hit. file=%s.json', fileName);
    return cache.get(fileName);
  }

  // Build path: src/testData/<fileName>.json
  const filePath = path.join(process.cwd(), "src/testData", `${fileName}.json`);
  consoleLogger.debug('DATA-FACTORY: Cache miss — reading from disk. filePath=%s', filePath);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    cache.set(fileName, data);
    consoleLogger.info('DATA-FACTORY: Loaded and cached. file=%s.json | keys=%s',
      fileName, Object.keys(data).join(', '));
    return data;
  } catch (error: any) {
    consoleLogger.error('DATA-FACTORY: Failed to load. filePath=%s | error=%s', filePath, error.message);
    throw new Error(
      `DATA-FACTORY: Unable to load test data file: ${filePath}. ` +
      `Original error: ${error.message}`
    );
  }
}
```

### How the Cache Works

| Call | Cache State | Action |
|---|---|---|
| First call for `"login"` | Miss | Reads `login.json` from disk, parses JSON, stores in `Map` |
| Every subsequent call for `"login"` | Hit | Returns the cached object instantly, no disk access |
| First call for `"article"` | Miss | Reads `article.json` from disk (independent entry) |

The `Map` is declared at **module scope**, so it persists for the lifetime of the Node.js
worker process. Playwright runs each worker as a separate process — each worker has its
own independent cache.

---

## 3. Directory Layout

All test data files live under `src/testData/`. One JSON file per spec file.

```
src/
├── testData/
│   ├── login.json               ← data for eventApp-login.spec.ts
│   ├── article.json             ← data for article.spec.ts
│   ├── home.json                ← data for home.spec.ts
│   └── eventApp-booking.json    ← data for eventApp-booking.spec.ts
│
└── tests/
    ├── conduit/
    │   ├── article.spec.ts      ← uses article.json
    │   └── home.spec.ts         ← uses home.json
    └── eventApp/
        ├── eventApp-login.spec.ts     ← uses login.json
        └── eventApp-booking.spec.ts   ← uses eventApp-booking.json
```

### Naming Convention

| Spec file | JSON file |
|---|---|
| `eventApp-login.spec.ts` | `login.json` |
| `eventApp-booking.spec.ts` | `eventApp-booking.json` |
| `article.spec.ts` | `article.json` |
| `home.spec.ts` | `home.json` |

**Rule:** Name the JSON after the feature/spec, not after the page or the flow. One JSON per spec file keeps data scoped and easy to find.

---

## 4. JSON File Structure

Structure your JSON with **named scenario objects** at the top level. Each scenario object
contains `inputs` (what you send to the UI) and `expected` (what you assert against).

```json
{
  "validLogin": {
    "inputs": {
      "username": "user1",
      "password": "pass1"
    },
    "expected": {
      "message": "Login successful",
      "redirectUrl": "/dashboard"
    }
  },

  "invalidLogin": {
    "inputs": {
      "username": "invalid-user",
      "password": "wrong-pass"
    },
    "expected": {
      "message": "Invalid credentials"
    }
  },

  "lockedOutUser": {
    "inputs": {
      "username": "locked-user",
      "password": "pass1"
    },
    "expected": {
      "message": "Your account has been locked"
    }
  }
}
```

### Why This Structure

- **Top-level keys** = test scenarios — easy to find which key belongs to which test.
- **`inputs`** = values passed into UI actions.
- **`expected`** = values used in `expect()` assertions.
- Separating inputs from expected makes it obvious what each field is for.

---

## 5. Loading Data in a Spec File

### Golden Rule — Call `getTestData()` at Module Scope

Call it **once, at the top of the spec file, outside any `test()` or hook**. This ensures
the file is loaded when the module is first imported by the worker — before any test runs.

```typescript
import { getTestData } from "../../utils/data-factory";

// ✅ CORRECT — module scope, runs once when worker loads the spec
const loginData = getTestData("login");

test('Valid login succeeds @sanity', async ({ eventAppPm }) => {
    // loginData is already in memory — no disk access here
    const { username, password } = loginData.validLogin.inputs;
    const { message } = loginData.validLogin.expected;
    // ... use in flow or assertion
});

test('Invalid login shows error @regression', async ({ eventAppPm }) => {
    // Same loginData object shared — zero extra work
    const { username, password } = loginData.invalidLogin.inputs;
    const { message } = loginData.invalidLogin.expected;
    // ...
});
```

```typescript
// ❌ WRONG — inside test(), reads from disk or cache on every test execution
test('Valid login @sanity', async ({ eventAppPm }) => {
    const loginData = getTestData("login");   // don't do this
    // ...
});
```

---

## 6. Using Test Data — Full Example

**`src/testData/login.json`**
```json
{
  "validLogin": {
    "inputs": { "username": "user1", "password": "pass1" },
    "expected": { "message": "Login successful" }
  },
  "invalidLogin": {
    "inputs": { "username": "invalid-user2", "password": "invalid-pass2" },
    "expected": { "message": "Invalid credentials" }
  }
}
```

**`src/tests/eventApp/eventApp-login.spec.ts`**
```typescript
import { test } from '../../fixtures/eventApp-auth.fixture';
import { expect } from '@playwright/test';
import { EventAppHomeFlow } from '../../bussiness-flows/eventApp/eventApp-home.flow';
import { TestExecutionError } from '../../errors/testLevelGenericError';
import { consoleLogger } from '../../utils/logger';
import { getTestData } from '../../utils/data-factory';

// ── Load test data once at module scope (worker-level cache) ──────────────────
const loginData = getTestData("login");

test('Valid login loads homepage @sanity', async ({ eventAppPm }) => {
    consoleLogger.info('Start of test: Valid login loads homepage');

    const { username, password } = loginData.validLogin.inputs;
    consoleLogger.debug('Using credentials: username=%s', username);

    const homeFlow = new EventAppHomeFlow(eventAppPm);
    let currentUrl: string;

    try {
        // Pass data into your flow/action
        currentUrl = await homeFlow.verifyHomepageLoaded();
        consoleLogger.info('Homepage verified. currentUrl=%s', currentUrl);
    } catch (error: any) {
        consoleLogger.error('Homepage verification failed. error=%s', error.message);
        throw new TestExecutionError(`Homepage check failed. Original error: ${error.message}`);
    }

    // ── Assertions outside try/catch ─────────────────────────────────────────
    expect(currentUrl).toContain('eventhub.rahulshettyacademy.com');

    consoleLogger.info('End of test: Valid login loads homepage');
});

test('Invalid credentials show error @regression', async ({ eventAppPm }) => {
    consoleLogger.info('Start of test: Invalid credentials show error');

    const { username, password } = loginData.invalidLogin.inputs;
    const { message: expectedMsg } = loginData.invalidLogin.expected;

    consoleLogger.debug('Testing with invalid user: username=%s', username);

    let actualMessage: string;

    try {
        // pass username + password to your login flow
        // actualMessage = await loginFlow.attemptLogin(username, password);
    } catch (error: any) {
        consoleLogger.error('Login flow failed. error=%s', error.message);
        throw new TestExecutionError(`Login attempt failed. Original error: ${error.message}`);
    }

    // expect(actualMessage).toBe(expectedMsg);

    consoleLogger.info('End of test: Invalid credentials show error');
});
```

---

## 7. Log Output Reference

When `getTestData()` runs, you will see these logs in the test output:

```
[...] [RUN_ID=abc123] DEBUG: DATA-FACTORY: Cache miss — reading from disk. filePath=D:\...\src\testData\login.json
[...] [RUN_ID=abc123] INFO:  DATA-FACTORY: Loaded and cached successfully. file=login.json | keys=validLogin, invalidLogin

# --- Second call (same worker, same file) ---
[...] [RUN_ID=abc123] DEBUG: DATA-FACTORY: Cache hit — returning cached data. file=login.json
```

On error (wrong file name, malformed JSON):
```
[...] [RUN_ID=abc123] ERROR: DATA-FACTORY: Failed to load test data file. filePath=D:\...\login.json | error=ENOENT: no such file or directory
```

---

## 8. Checklist — Adding Test Data for a New Spec

```
[ ] 1. Create src/testData/<featureName>.json
[ ] 2. Add top-level scenario keys: validXxx, invalidXxx, edgeCaseXxx, etc.
[ ] 3. Each scenario has "inputs" and "expected" sub-objects
[ ] 4. In the spec file, add at module scope:
         const featureData = getTestData("<featureName>");
[ ] 5. In each test, destructure what you need:
         const { field } = featureData.<scenario>.inputs;
         const { field } = featureData.<scenario>.expected;
[ ] 6. Pass inputs to flow methods; use expected values in expect() assertions
[ ] 7. Never call getTestData() inside a test() or beforeEach() block
```

---

## 9. What NOT to Do

| Anti-pattern | Why it's wrong |
|---|---|
| `getTestData()` inside `test()` body | Unnecessary — cache makes in-scope call redundant; also harder to read |
| `getTestData()` inside `beforeEach()` | Still per-test overhead + noise in logs |
| Hardcoding test values in spec files | Breaks when data changes; values scattered across many files |
| One giant JSON for all specs | Tight coupling — unrelated spec changes affect unrelated data |
| Storing secrets/passwords in JSON | Use environment variables or a vault; JSON is committed to source control |
| No `expected` keys in JSON | Forces magic strings into `expect()` calls in spec files |
