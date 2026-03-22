import fs from "fs";
import path from "path";
import { consoleLogger } from "./logger";

// Module-level cache — lives for the lifetime of the worker process.
// First call per fileName reads from disk; subsequent calls return the cached object.
const cache = new Map<string, any>();

/**
 * Loads a JSON test-data file from src/testData/ and caches the result
 * for the lifetime of the Playwright worker process.
 *
 * Call this ONCE at module scope (outside any test/hook) so the file is
 * read a single time and shared across all tests in the worker.
 *
 * Example usage (top of spec file):
 *   const loginData = getTestData("login");
 *
 * Expected file location: src/testData/<fileName>.json
 */
export function getTestData(fileName: string): any {

  // ── Cache hit: data already loaded for this worker ──────────────────────
  if (cache.has(fileName)) {
    consoleLogger.debug('DATA-FACTORY: Cache hit — returning cached data. file=%s.json', fileName);
    return cache.get(fileName);
  }

  // ── Build absolute path to the JSON file ────────────────────────────────
  const filePath = path.join(
    process.cwd(),
    "src/testData",
    `${fileName}.json`
  );

  consoleLogger.debug('DATA-FACTORY: Cache miss — reading from disk. filePath=%s', filePath);

  try {
    // Read file content from disk
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Parse JSON string into a plain object
    const data = JSON.parse(fileContent);

    // Store in worker-level cache so the file is never read twice
    cache.set(fileName, data);

    consoleLogger.info('DATA-FACTORY: Test data loaded and cached successfully. file=%s.json | keys=%s',
      fileName, Object.keys(data).join(', '));

    return data;

  } catch (error: any) {
    consoleLogger.error('DATA-FACTORY: Failed to load test data file. filePath=%s | error=%s',
      filePath, error.message);

    throw new Error(
      `DATA-FACTORY: Unable to load test data file: ${filePath}. ` +
      `Please check the file name, path, and JSON format. Original error: ${error.message}`
    );
  }
}