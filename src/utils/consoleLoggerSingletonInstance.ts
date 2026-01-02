// utils/logger.ts  (the SINGLE shared instance)

// single shared instance (one per worker process)
import { ConsoleLogger } from './consoleLogger';

// (keep any of your existing exports in this file unchanged)
export const consoleLogger = new ConsoleLogger();

// Bas. Ab jitni jagah logger chahiye, sirf logger import karna. Kahin bhi new CustomLogger() MAT banana.