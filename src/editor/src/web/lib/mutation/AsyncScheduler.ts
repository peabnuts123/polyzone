import { Deferred, createDeferred } from '@lib/util/deferred';

interface AsyncTask {
  func: () => Promise<void>;
  deferred: Deferred;
}



export class AsyncScheduler {
  private taskQueue: AsyncTask[] = [];

  public async runTask(taskFunction: () => Promise<void>): Promise<void> {
    // Associated task with deferred promise into `AsyncTask` block of work
    const task: AsyncTask = {
      func: taskFunction,
      deferred: createDeferred(),
    };

    const isQueueEmpty = this.currentTask === undefined;

    // Add task to queue
    this.taskQueue.push(task);

    if (isQueueEmpty) {
      // No other tasks running, execute the task queue
      void this.executeTask();
    } // else task queue is already assumed to be executing

    // Return deferred promise - will resolve when task is finished running
    return task.deferred.promise;
  }

  private async executeTask(): Promise<void> {
    // Sanity check
    if (this.taskQueue.length === 0) {
      console.error(`Attempted to execute task while task queue was empty`);
      return;
    }

    // Read task from queue (don't dequeue just yet)
    const task = this.taskQueue[0];

    // Run the work inside the task
    try {
      await task.func();
      // Task resolved / succeeded, update deferred
      task.deferred.resolve();
    } catch (e) {
      // Task rejected / threw, update deferred
      task.deferred.reject(e);
    }

    // Task has completed, remove from queue
    this.taskQueue.shift();

    // If any more tasks, continue processing
    if (this.taskQueue.length > 0) {
      setTimeout(() => this.executeTask());
    }
  }

  private get currentTask(): AsyncTask | undefined {
    if (this.taskQueue.length > 0) {
      return this.taskQueue[0];
    } else {
      return undefined;
    }
  }
}


// export class debug__Mutator {
//   // public apply(
//   private state: string = "";
//   private static __scheduler: AsyncScheduler;

//   public constructor() {
//     debug__Mutator.__scheduler = new AsyncScheduler();
//   }

//   public mutate(mutator: (state: string) => Promise<void>): Promise<void> {
//     return this.scheduler.runTask(async () => {
//       /* ... do some things ... */
//       await mutator(this.state);
//       /* ... do some other things ... */
//     });
//   }

//   private get scheduler(): AsyncScheduler {
//     return debug__Mutator.__scheduler;
//   }
// }
