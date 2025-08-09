import { test, describe, expect } from 'vitest';
import { createDeferred } from '@lib/util/deferred';
import { sleep } from '@test/util';
import { AsyncScheduler } from './AsyncScheduler';

describe(AsyncScheduler.name, () => {
  test("Scheduling several async tasks at once runs them in series", async () => {
    // Setup
    /*
      @NOTE Slightly brittle test, the values in `TestNames` have to match `expectedResults`.
      I had this test generate the list of expected results, but it made the test too complicated.
     */
    const TestNames = ['A', 'B', 'C'];
    const expectedResults: string[] = [
      'A:queue',
      'A:run',      // A is invoked immediately since the scheduler queue is empty
      'B:queue',    // B and C are queued but not run
      'C:queue',
      'A:done',
      'B:run',      // Once A is done, B is run
      'B:done',
      'C:run',      // Once B is done, C is run
      'C:done',
    ];
    const results: string[] = [];

    const scheduler = new AsyncScheduler();

    // Test
    await Promise.all(
      TestNames.map((testName) => {
        // Test is being queued
        results.push(`${testName}:queue`);

        // Run / queue each task
        return scheduler.runTask(() => {
          // Test is being run => sleep
          results.push(`${testName}:run`);
          return sleep(10);
        })
          .then(() => {
            // Test has completed
            results.push(`${testName}:done`);
          });
      }),
    );

    // Assert
    expect(results).toEqual(expectedResults);
  });
  test("Scheduling a task does not invoke the function until the previous task is done", async () => {
    // Setup
    const scheduler = new AsyncScheduler();

    // Test
    // Schedule a task that will not finish until the deferred is resolved
    const deferred = createDeferred();
    void scheduler.runTask(() => deferred.promise);

    // Schedule a second task
    let hasSecondTaskRun = false;
    const secondTask = scheduler.runTask(() => {
      hasSecondTaskRun = true;
      return Promise.resolve();
    });

    expect(hasSecondTaskRun).toBe(false);

    // Resolve the deferred to allow the first task to complete
    deferred.resolve();
    await secondTask;

    // Assert
    expect(hasSecondTaskRun).toBe(true);
  });
});

