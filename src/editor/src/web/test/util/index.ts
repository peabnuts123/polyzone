/**
 * Async sleep function.
 * @param timeMs Duration to sleep.
 * @usage
 * ```typescript
 * await sleep(1000); // Pauses execution for 1000ms
 * ```
 */
export function sleep(timeMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

/**
 * Generate a random hash string, in xxHash format (16 hex digits).
 */
export function randomHash(): string {
  return (0x10000000_00000000 + (Math.random() * 0xEFFFFFFF_FFFFFFFF)).toString(16);
}
