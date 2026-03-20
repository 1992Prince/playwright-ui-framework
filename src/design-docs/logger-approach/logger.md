# Logger Approach — Design Documentation

---

## Section 1 — Purpose and Code Walkthrough

### What Problem Does the Logger Solve?

In a test automation framework, you need to know **what happened** when a test runs or fails.
The browser does its work silently — clicking buttons, filling forms, navigating pages.
Without logs, you are blind. If a test fails at 2 AM in a CI pipeline, logs are your only window into what went wrong.

The framework uses a single file — `src/utils/logger.ts` — that every test, fixture, and flow imports and uses to print structured, coloured, timestamped messages to the terminal.

---

### The Full Code

```typescript
// src/utils/logger.ts

const RESET = '\x1b[0m';

class ConsoleLogger {

  private buildPrefix(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const runId     = process.env.RUN_ID ?? 'NA';
    return `[${timestamp}] [RUN_ID=${runId}] ${level}: ${message}`;
  }

  // Use for key milestones — test start/end, login, major action completed
  info(message: string, ...args: any[]): void {
    console.info(`\x1b[34m${this.buildPrefix('INFO', message)}${RESET}`, ...args);
  }

  // Use for non-fatal surprises — something unexpected but the test can continue
  warn(message: string, ...args: any[]): void {
    console.warn(`\x1b[33m${this.buildPrefix('WARN', message)}${RESET}`, ...args);
  }

  // Use immediately before re-throwing an error — what broke and why
  error(message: string, ...args: any[]): void {
    console.error(`\x1b[31m${this.buildPrefix('ERROR', message)}${RESET}`, ...args);
  }

  // Use for variable values, URLs, config — helpful when debugging a failure
  debug(message: string, ...args: any[]): void {
    console.log(`\x1b[32m${this.buildPrefix('DEBUG', message)}${RESET}`, ...args);
  }
}

// Class is NOT exported — only the ready-to-use instance is
export const consoleLogger = new ConsoleLogger();
```

---

### Line-by-Line Code Explanation

#### Line 1 — `const RESET = '\x1b[0m';`

```typescript
const RESET = '\x1b[0m';
```

`\x1b[0m` is an **ANSI escape code** — a special invisible character sequence that terminals understand as a command to change text colour.

Think of it as turning a colour switch ON and OFF:
- `\x1b[34m` → turns text BLUE
- `\x1b[0m`  → turns ALL colour OFF, back to terminal default

`RESET` is placed at the **end of every log message** to ensure the terminal colour turns off immediately after the message is printed. Without it, everything printed after a blue INFO log would also appear blue — including error messages, Playwright output, and stack traces.

---

#### Lines 3–5 — `class ConsoleLogger`

```typescript
class ConsoleLogger {
```

A **class** is a blueprint for creating an object. This blueprint describes:
- What data the logger holds (nothing, in this simplified version)
- What actions the logger can perform (4 methods: `info`, `warn`, `error`, `debug`)

The class is intentionally **not exported** (there is no `export` keyword before `class`). This means no file outside `logger.ts` can import the class and create its own instance with `new ConsoleLogger()`. The only thing exported from this file is the one ready-made instance at the bottom.

---

#### Lines 7–11 — `buildPrefix()` method

```typescript
private buildPrefix(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  const runId     = process.env.RUN_ID ?? 'NA';
  return `[${timestamp}] [RUN_ID=${runId}] ${level}: ${message}`;
}
```

**What it does:** Builds the structured header that appears at the start of every log line.

**Output example:**
```
[2026-03-20T10:30:00.000Z] [RUN_ID=RUN_20260320_103000_123] INFO: Article published successfully
```

Breaking down each part:

| Part | Code | Example output |
|---|---|---|
| Timestamp | `new Date().toISOString()` | `2026-03-20T10:30:00.000Z` |
| Run ID | `process.env.RUN_ID` | `RUN_20260320_103000_123` |
| Level | `level` parameter | `INFO` / `WARN` / `ERROR` / `DEBUG` |
| Message | `message` parameter | `Article published successfully` |

**`process.env.RUN_ID`** — this is a value set in `global-setup.ts` before any test runs. It is a unique ID for the entire test run (e.g., `RUN_20260320_103000_123`). Having it in every log line means you can filter all logs from one specific run — very useful in CI where multiple runs may be logged together.

**`?? 'NA'`** — the `??` operator means "if the left side is null or undefined, use the right side instead". So if `RUN_ID` was never set (e.g., running a single test file directly without global-setup), you see `NA` instead of a crash.

**`private`** — the `private` keyword means this method can only be called from inside the `ConsoleLogger` class. It is an internal helper, not intended to be used by tests directly.

---

#### Lines 13–16 — `info()` method

```typescript
// Use for key milestones — test start/end, login, major action completed
info(message: string, ...args: any[]): void {
  console.info(`\x1b[34m${this.buildPrefix('INFO', message)}${RESET}`, ...args);
}
```

**What `...args` means:**
`...args` is called a **rest parameter**. It collects any extra values you pass after the message into an array. This enables `%s` placeholder substitution:

```typescript
consoleLogger.info('Application URL is %s', config.url);
//                                     ↑       ↑
//                                 placeholder  args[0] — replaces %s
```

The native `console.info` function understands `%s` natively and substitutes the value. `...args` spreads the collected extra values into the call so this works correctly.

**`\x1b[34m`** — opens BLUE colour.
**`${RESET}`** — closes colour at the end.

---

#### Lines 18–21, 23–26, 28–31 — `warn()`, `error()`, `debug()`

These three methods follow the exact same structure as `info()`. The only differences are:

| Method | Colour Code | Colour | Native function |
|---|---|---|---|
| `info`  | `\x1b[34m` | Blue   | `console.info`  |
| `warn`  | `\x1b[33m` | Yellow | `console.warn`  |
| `error` | `\x1b[31m` | Red    | `console.error` |
| `debug` | `\x1b[32m` | Green  | `console.log`   |

Each uses the correct native console function so that environments which filter by console type (e.g., CI log dashboards) also handle them appropriately.

---

#### Last 2 lines — the Singleton export

```typescript
// Class is NOT exported — only the ready-to-use instance is
export const consoleLogger = new ConsoleLogger();
```

`new ConsoleLogger()` creates one instance of the class and assigns it to `consoleLogger`.
`export const` makes it available to every other file that imports it.

Because the class itself is not exported, **this is the only instance that can ever exist**. Every file in the framework shares this one object.

---

## Section 2 — When to Use Each Log Level

### The Core Rule

> Each level has a specific **intention**. Using them correctly means that anyone reading the logs can instantly understand the health and progress of a test without reading the test code.

---

### Level Guide

| Level | Colour | Question it answers | Urgency |
|---|---|---|---|
| `info`  | Blue   | "What milestone did we just reach?" | Normal |
| `debug` | Green  | "What data was involved?" | Diagnostic |
| `warn`  | Yellow | "Something unexpected happened — should we be worried?" | Caution |
| `error` | Red    | "What broke, and what were we doing when it broke?" | Critical |

---

### Real Example — `article.spec.ts` annotated

Below is the `Create and Delete Article Test` test with every log call explained:

```typescript
test('Create and Delete Article Test', async ({ authenticatedPage }) => {

  // ✅ INFO — test has started. Key milestone.
  consoleLogger.info('Start of test: Create and Delete Article Test');

  const pm = new PageManager(authenticatedPage);

  // ✅ INFO — PageManager is ready. Another milestone confirming setup succeeded.
  consoleLogger.info('PageManager created');

  const articleFlow = pm.getArticleFlow();

  // ✅ INFO — flow object obtained, we are about to do the real work.
  consoleLogger.info('Got article flow');

  const articleTitle = 'Test Article Title';

  // ✅ DEBUG — raw variable value. Not a milestone, just diagnostic data.
  //            Useful if the test fails and you need to know exactly what title was used.
  consoleLogger.debug('Article title: %s', articleTitle);

  try {
    await articleFlow
      .withTitle(articleTitle)
      .withAbout('About Test Article')
      .withContent('This is the content of the test article.')
      .withTags('test,article')
      .publish();

    // ✅ INFO — publish succeeded. Major action completed.
    consoleLogger.info('Article published successfully');

  } catch (error: any) {
    // ✅ ERROR — something broke. Log the exact error message before re-throwing.
    //            Always immediately before a throw statement.
    consoleLogger.error('Error publishing article: %s', error.message);
    throw new TestExecutionError(`Failed to publish article. Original error: ${error.message}`);
  }

  // ✅ WARN — deletion is a destructive and irreversible action.
  //           Not an error, but flagging it as something to pay attention to.
  consoleLogger.warn('About to delete the article. This is a destructive action.');

  await pm.getArticleFlow().deleteCurrentArticle();

  // ✅ INFO — deletion completed. Milestone confirmed.
  consoleLogger.info('Article deleted successfully');

  // ✅ INFO — test has ended cleanly.
  consoleLogger.info('End of test: Create and Delete Article Test');
});
```

---

### The Decision Flow — Which Level to Choose?

```
Is the action a significant step completing successfully?
  YES → INFO

Was this a data value, URL, config, or variable helpful for debugging?
  YES → DEBUG

Did something unexpected happen but the test can still continue?
  YES → WARN

Did something fail and are you about to throw an error?
  YES → ERROR  (always immediately followed by: throw ...)
```

---

### What NOT to Do

```typescript
// ❌ WRONG — logging inside a POM method
async clickSubmitButton(): Promise<void> {
  consoleLogger.debug('Clicking submit button');  // POMs should not log
  await this.safeClick(this.submitButton, 'FORM PAGE ERROR: ...');
}

// ❌ WRONG — using debug for a milestone
consoleLogger.debug('Test started');  // This is a milestone → use info

// ❌ WRONG — using info for raw data
consoleLogger.info('Article title: %s', title);  // This is diagnostic data → use debug

// ❌ WRONG — error without throwing
consoleLogger.error('Something failed');  // If you log error, always throw after it
// ... but no throw here — misleading

// ✅ CORRECT — error always paired with throw
consoleLogger.error('Something failed: %s', error.message);
throw new TestExecutionError(`...`);
```

> **Rule of thumb:** Logging belongs in **spec files and flow classes only**. POMs throw errors — they do not log. Specs and flows catch those errors, log them, and re-throw.

---

## Section 3 — Singleton Pattern, Worker Isolation, and Race Conditions

### What is a Singleton?

A **Singleton** is a design pattern that ensures a class has only **one instance** throughout the lifetime of a program. Instead of creating a new object every time you need it, you create it once and reuse the same object everywhere.

In `logger.ts`:
```typescript
class ConsoleLogger { ... }              // blueprint — not exported
export const consoleLogger = new ConsoleLogger();  // one instance — exported
```

Every file that writes `import { consoleLogger } from '../../utils/logger'` receives the **exact same object**. Not a copy. The same object in memory.

---

### Why Does the Singleton Work Here? — Node.js Module Caching

When Node.js loads a file (module) for the first time, it:
1. Executes all the code in that file
2. Caches the result

The next time any file imports the same module, Node.js **returns the cached result** — it does NOT re-execute the file.

```
First import:   import { consoleLogger } from '../../utils/logger'
                → Node.js runs logger.ts → creates ConsoleLogger instance → caches it

Second import:  import { consoleLogger } from '../../utils/logger'  (different file)
                → Node.js returns cached module → same consoleLogger instance returned
```

This means `new ConsoleLogger()` runs **exactly once per process**. After that, every import gets the same already-created object.

---

### How Playwright Runs Tests — Workers Explained

When you run tests with multiple workers in `playwright.config.ts`:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4,  // run 4 tests at the same time
});
```

Playwright spawns **4 completely separate operating system processes**. Think of each worker as a brand new program — it has:
- Its own Node.js runtime
- Its own memory
- Its own copy of every imported module
- Its own `consoleLogger` instance

```
Your machine RAM
│
├── Worker Process 1 (PID 1001)
│     └── its own consoleLogger instance A
│
├── Worker Process 2 (PID 1002)
│     └── its own consoleLogger instance B
│
├── Worker Process 3 (PID 1003)
│     └── its own consoleLogger instance C
│
└── Worker Process 4 (PID 1004)
      └── its own consoleLogger instance D
```

Instances A, B, C, D are **completely independent**. They live in different memory spaces. There is **zero sharing between them**.

---

### Why There Are No Race Conditions

A **race condition** occurs when two threads of execution read and write the **same piece of shared memory** at the same time, producing unpredictable results.

Race conditions are impossible in this setup for three reasons:

#### Reason 1 — No shared memory between workers

Each worker is a separate OS process. Separate processes cannot access each other's memory. The `consoleLogger` in Worker 1 and the `consoleLogger` in Worker 2 are physically different objects in different memory spaces. They cannot interfere with each other.

#### Reason 2 — JavaScript is single-threaded

Inside a single worker process, JavaScript runs on a single thread. Only **one line of code executes at a time**. Even with `async/await`, JavaScript does not run two operations simultaneously — it runs one, pauses it, runs another, resumes the first. This means within one worker, two `consoleLogger.info()` calls can never truly execute at the same moment.

```
Worker 1 timeline (single thread):

t=0ms  → consoleLogger.info('Test A started')   ← runs fully
t=1ms  → await page.click(...)                  ← paused here, waiting for browser
t=50ms → consoleLogger.info('Test A: button clicked')  ← resumes, runs fully
```

There is never a moment where two log calls are running simultaneously inside the same worker.

#### Reason 3 — `console.log` writes are atomic

When multiple workers print to the terminal at the same time, each individual log line write is **atomic at the OS level** — meaning one line completes fully before the next one starts. Lines from different workers may appear interleaved in order (Worker 1 line, then Worker 3 line, then Worker 1 line), but a single line will never be corrupted or partially overwritten by another worker.

---

### The Complete Picture — What Happens at Runtime

```
BEFORE ANY TEST:
  global-setup.ts runs → sets process.env.RUN_ID = 'RUN_20260320_103000_123'
  This value is inherited by all worker processes when they start

WHEN WORKER 1 STARTS:
  Node.js loads logger.ts for the first time
  new ConsoleLogger() runs once
  consoleLogger instance is created and cached
  process.env.RUN_ID is already set → buildPrefix() will read it correctly

DURING A TEST IN WORKER 1:
  consoleLogger.info('Start of test: Article creation')
  → buildPrefix() reads RUN_ID from env (read-only, no writing)
  → builds the formatted string
  → console.info() writes one line to stdout (atomic)

SIMULTANEOUSLY IN WORKER 2:
  consoleLogger.info('Start of test: Home page test')
  → completely separate instance, completely separate memory
  → same process, no conflict with Worker 1
```

---

### Summary

| Question | Answer |
|---|---|
| How many `consoleLogger` instances exist per worker? | Exactly 1 — created once when the module first loads |
| Can two workers share the same instance? | No — each worker is a separate OS process with its own memory |
| Can two log calls in the same worker conflict? | No — JavaScript is single-threaded, one call runs at a time |
| Can `console.log` output get corrupted across workers? | No — individual line writes are atomic at the OS level |
| Is `RUN_ID` safe to read in parallel? | Yes — it is set before workers start and only ever read, never written |
| Is `new ConsoleLogger()` called multiple times? | No — Node.js module caching ensures it runs exactly once per process |
