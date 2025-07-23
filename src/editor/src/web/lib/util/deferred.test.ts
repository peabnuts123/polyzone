import { describe, expect, test } from 'vitest';
import { createDeferred } from './deferred';

describe('Deferred', () => {
  test("Can construct", async () => {
    // Setup / Test
    const deferred = createDeferred<number>();

    // Assert
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(deferred.resolve).not.toBeUndefined();
        expect(deferred.reject).not.toBeUndefined();
        expect(deferred.hasResolved).toBe(false);
        expect(deferred.hasRejected).toBe(false);
        resolve();
      }, 10);
    });
  });
  test("Calling resolve() resolves the deferred", async () => {
    // Setup
    const deferred = createDeferred<number>();
    const mockResult = 2;

    // Test
    deferred.resolve(mockResult);
    const result = await deferred.promise;

    // Assert
    expect(deferred.hasResolved).toBe(true);
    expect(deferred.hasRejected).toBe(false);
    expect(result).toBe(mockResult);
  });
  test("Calling reject() rejects the deferred", async () => {
    // Setup
    const deferred = createDeferred<number>();
    const mockError = new Error("Test error");

    // Test
    deferred.reject(mockError);
    try {
      await deferred.promise;
    } catch (error) {

      // Assert
      expect(deferred.hasResolved).toBe(false);
      expect(deferred.hasRejected).toBe(true);
      expect(error).toBe(mockError);
    }
  });
});
