# Fix: Ctrl+Click TypeScript Navigation Not Working in VS Code

## Problem Statement

When working in a Playwright + TypeScript project, pressing **Ctrl+Click** on a class name,
method, or import in VS Code did **not** navigate to its definition in another file.

### Example That Failed

In `eventApp-auth.flow.ts`, Ctrl+Clicking on the `smartLogin` method call:

```typescript
await this.pm.getEventAppLoginPage().smartLogin(url, email, password);
```

...did nothing — VS Code showed **"No definition found"** or jumped to the type declaration
instead of the actual implementation in `eventApp-login.page.ts`.

---

## Root Cause

The project had **no `tsconfig.json`** file at the root.

Without `tsconfig.json`, the VS Code TypeScript language server runs in
**"loose single-file mode"**. In this mode:

- Each `.ts` file is processed in isolation
- Cross-file imports cannot be resolved
- Go-to-Definition (Ctrl+Click) breaks across files
- Auto-import suggestions are incomplete or missing
- Type errors in one file referencing another may not surface

This is a **silent failure** — TypeScript still compiles, tests still run via
`ts-node` / `tsx`, but the IDE experience is severely degraded.

---

## Solution

Create a `tsconfig.json` file at the **project root** (same level as `package.json`):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "skipLibCheck": true
  },
  "include": [
    "src/**/*",
    "playwright.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "playwright-report",
    "test-results"
  ]
}
```

### Key settings explained

| Setting | Why it matters |
|---|---|
| `"include": ["src/**/*"]` | Tells TS server the full project scope — enables cross-file resolution |
| `"baseUrl": "."` | Allows imports to resolve from the project root |
| `"strict": true` | Enforces type safety across all files |
| `"skipLibCheck": true` | Prevents noise from third-party type definition files |
| `"module": "commonjs"` | Matches how Playwright / Node.js resolves modules at runtime |

---

## Steps to Apply the Fix

1. **Create** `tsconfig.json` at the project root with the JSON above.

2. **Restart the TypeScript language server** in VS Code:
   - Press `Ctrl+Shift+P`
   - Type: `TypeScript: Restart TS Server`
   - Press `Enter`
   - Wait ~5 seconds for indexing to complete

3. **Verify the fix** — open any flow or spec file and Ctrl+Click on:
   - An imported class name → should jump to the class definition
   - A method call → should jump to the method body
   - An import path → should open the imported file

---

## Symptoms Checklist

Use this to diagnose the same issue in any other TypeScript project:

- [ ] Ctrl+Click on a class or method shows "No definition found"
- [ ] Auto-import suggestions are missing or wrong
- [ ] TypeScript errors are not shown across file boundaries
- [ ] `tsconfig.json` does not exist at the project root

If all four are true → missing `tsconfig.json` is almost certainly the cause.

---

## Notes

- Playwright itself does **not require** `tsconfig.json` to run — tests work fine without it.
  This is purely an IDE / language server issue.
- If you clone this repo fresh, `tsconfig.json` is already included — no action needed.
- If you see a **"rootDir is expected to contain all source files"** error after adding
  `tsconfig.json`, make sure `rootDir` matches where your `.ts` files live (`"./"` covers
  both `src/` and `playwright.config.ts`).
