import { describe, test, expect } from 'vitest';
import { Runtime } from './Runtime';

describe("Runtime", () => {
  /** Just a test to make 'npm run checkall' happy */
  test("exists (example test)", () => {
    // Setup
    const runtime = new Runtime(undefined!);

    // Assert
    expect(runtime).not.toBeUndefined();
  });
});
