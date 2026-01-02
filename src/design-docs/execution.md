# Test Execution Flow

This document outlines the end-to-end execution flow of the Playwright test automation framework.

## Execution Diagram

![Execution Flow](image/execution/1767268631326.png)

## Simple Command Flow

`npx playwright test` -> `global-setup.ts` -> `playwright.config.ts` -> `fixtures` -> `before annotations` -> `tests` -> `after annotations` -> `post fixture` -> `global-teardown`

## Step-by-Step Execution

1.  **Initiation**: The test execution starts when a user runs the command `npx playwright test` from the terminal.

2.  **Global Setup**: Before any tests run, the `global-setup.ts` file is triggered. Its primary responsibility is to perform setup tasks that apply to the entire test run, such as creating a unique `runid` for logging and reporting purposes.

3.  **Playwright Configuration**: Playwright reads the `playwright.config.ts` file. This file defines the core configuration, including the path to the test directory (`src/tests`), browser settings, reporters, and points to the global setup and teardown scripts.

4.  **Fixture Execution (Setup)**: For each test that requires it, the `auth.fixture.ts` file is executed.
    *   It loads necessary configuration data like user credentials and application URLs from `src/config/config.ts`.
    *   The "setup" portion of the fixture code is executed. For the `authenticatedPage` fixture, this involves logging in a user to ensure the test starts on an authenticated page.

5.  **Test Hooks**: If the test file contains `beforeAll` or `beforeEach` annotations, their code is executed before the test steps.

6.  **Test Spec Execution**: The actual test code within the `.spec.ts` file begins to execute.
    *   The test instantiates the `PageManager`, which is the entry point for interacting with all Page Objects and Business Flows.
    *   The test requests specific Page Objects or Business Flow classes from the `PageManager`.
    *   The test then calls methods on these classes to perform UI actions (e.g., `createArticle()`, `deleteArticle()`).
    *   **Assertions**: All assertions (`expect` calls) are performed directly within the test spec file. This keeps the test logic and verification in one place.

7.  **Fixture Execution (Teardown)**: Once the test spec has finished executing, the "teardown" portion of the fixture is run. For the `authenticatedPage` fixture, this involves logging the user out.

8.  **Global Teardown**: After all tests have completed, the `global-teardown.ts` script is executed to perform any final cleanup tasks.

## Error Handling

-   **Page Objects**: If an error occurs at the UI interaction level (e.g., an element is not found), the Page Object class should throw a specific, custom UI error (e.g., `UIError`). Assertions should be avoided here.
-   **Spec Files**: The test spec files are responsible for catching errors from the lower layers. They can handle business-level errors or UI errors and can throw a `TestLevelGenericError` or `TestExecutionError` to clearly signal a test failure with context.

## Best Practices for Error Handling

### What happens with your current test code
Your code (problematic part)
```typescript
try {
  ...
  expect(allTagsText.length).toBeGreaterThan(0);
  expect(allTagsText).toContain('Global');
} catch (error) {
  throw new TestExecutionError('Test failed due to unexpected error.');
}
```

### What Playwright does on assertion failure

When this fails:
```typescript
expect(allTagsText).toContain('Global');
```

Playwright throws an `AssertionError` like:
```
Expected array to contain 'Global'
Received: [...]
```

### What YOUR catch block does

Your catch block:
- Catches everything
- Discards the original assertion message
- Throws a generic `TestExecutionError`

Final reported error becomes:
```
TestExecutionError: Test failed due to unexpected error.
```

❌ Root cause LOST
❌ Assertion details LOST
❌ Debugging pain
❌ Interview red flag

### Golden Rule (VERY IMPORTANT)

❌ Never wrap `expect()` failures in a generic `catch`.
✅ Let assertion errors bubble up naturally.

### When SHOULD you catch and throw TestExecutionError?
Catch ONLY when you are:
- Adding business context
- Wrapping non-assertion failures
- Handling flow orchestration errors

### ✅ Correct Pattern #1 (BEST PRACTICE)
Move assertions OUTSIDE try-catch
```typescript
let allTagsText: string[];

try {
  const pm = new PageManager(authenticatedPage);
  const articleFlow = pm.getArticleFlow();
  allTagsText = await articleFlow.getAllTagsList();
} catch (error) {
  throw new TestExecutionError(
    `Failed to fetch tags. Original error: ${(error as Error).message}`
  );
}

// ✅ Assertions should fail naturally
expect(allTagsText.length).toBeGreaterThan(0);
expect(allTagsText).toContain('Global');
```

✔ Assertion messages preserved
✔ Business failure still wrapped
✔ Clean failure reports

### ✅ Correct Pattern #2 (Advanced – selective catch)

If you must keep one block:
```typescript
try {
  ...
  expect(allTagsText).toContain('Global');
} catch (error) {
  if (error instanceof Error && error.name === 'AssertionError') {
    throw error; // let Playwright handle it
  }
  throw new TestExecutionError(
    `Test failed due to unexpected error: ${error.message}`
  );
}
```

⚠️ More complex, use only if needed.

### What SHOULD be wrapped into TestExecutionError?
| Failure Type      | Wrap? |
|-------------------|-------|
| UIError           | ✅    |
| API/network error | ✅    |
| Timeout           | ✅    |
| Assertion failure | ❌    |
| `expect()`        | ❌    |

### Interview-ready explanation (MEMORIZE)

“We never wrap assertion failures into generic test errors because that hides the actual validation failure. Assertions are allowed to bubble up naturally, while `TestExecutionError` is reserved for business-flow or unexpected technical failures.”

🔥 This answer alone will impress.
