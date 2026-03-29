import { confirm } from '@tauri-apps/plugin-dialog';
import { runInAction } from "mobx";

import { IContinuousMutation2, isContinuousMutation2 } from "./IContinuousMutation";
import { IMutation2 } from "./IMutation";
import { AsyncScheduler } from "./AsyncScheduler";
import { MutationController } from "./MutationController";

type MutationTarget = any;
type Constructor<T> = new (...args: any[]) => T;

class CurrentDebounceState<TMutationDependencies, TMutationArgs, TMutation extends IContinuousMutation2<TMutationDependencies, TMutationArgs>> {
  public readonly typeCtor: Constructor<TMutation>;
  public readonly mutationTarget: MutationTarget;
  public readonly mutation: TMutation;
  /**
   * The function that is called after the debounce expires.
   * Automatically clears the timeout if you call this function manually,
   * if the value in `timeoutKey` has been defined
   * @param earlyExpire Whether the debounce is expiring because the timeout lapsed, or because it was forced by a new mutation
   */
  public readonly onDebounceExpire: (earlyExpire: boolean) => Promise<void>;
  public timeoutKey: number;

  public constructor(
    typeCtor: Constructor<TMutation>,
    mutationTarget: MutationTarget,
    mutation: TMutation,
    onDebounceExpire: (earlyExpire: boolean) => Promise<void>,
  ) {
    this.typeCtor = typeCtor;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.mutationTarget = mutationTarget;
    this.mutation = mutation;
    // @NOTE wrap `onDebounceExpire` in a function that
    // clears the timeout (if it has not already fired)
    this.onDebounceExpire = (earlyExpire: boolean) => {
      if (earlyExpire) {
        window.clearTimeout(this.timeoutKey);
      }
      return onDebounceExpire(earlyExpire);
    };
    this.timeoutKey = undefined!;
  }

  public isSameDebounceAction(
    typeCtor: Constructor<TMutation>,
    mutationTarget: MutationTarget,
  ): boolean {
    return this.typeCtor === typeCtor && this.mutationTarget === mutationTarget;
  }
}

export interface ActiveMutation<TMutationDependencies = any> {
  id: number;
  // @TODO IMutation technically doesn't need its second param - try removing it
  instance: IMutation2<TMutationDependencies, unknown>;
}

// View of `Mutator` class without any access to generic properties
// @TODO Between `currentDebounceState` needing `any` in its type and this class
// I'm not sure the "strongly typed" refactor has paid off? Maybe the old style
// of just `AnyContinuousMutation` is simpler?
export abstract class BaseMutatorNew {
  public abstract get latestMutation(): ActiveMutation | undefined;
  public abstract get latestUndoneMutation(): ActiveMutation | undefined;
  public abstract redo(): Promise<void>;
  public abstract undo(): Promise<void>;
  public abstract register(): void;
  public abstract deregister(): void;
  public abstract clearRedoStack(): void;
}

export abstract class MutatorNew<TMutationDependencies> extends BaseMutatorNew {
  /**
   * Async Scheduler. Runs async tasks in series, in the order they are scheduled.
   * It is static so that every task across every mutator instance is all forced through
   * a single queue. This helps mutations remain consistent even across different parts in the app.
   * The assumption is the scheduler's queue will never be very long anyway,
   * so the UX implications of this will likely be insignificant.
   */
  protected static scheduler: AsyncScheduler = new AsyncScheduler();
  // @TODO I guess we should place some kind of large limit on this?
  private readonly activeMutationStack: ActiveMutation<TMutationDependencies>[];
  private readonly redoMutationStack: ActiveMutation<TMutationDependencies>[];
  private readonly mutationController: MutationController;

  // State
  // @NOTE Type laundering with `any` ¯\_(ツ)_/¯
  private currentDebounceState?: CurrentDebounceState<TMutationDependencies, unknown, any> = undefined;

  public constructor(mutationController: MutationController) {
    super();
    this.mutationController = mutationController;
    this.activeMutationStack = [];
    this.redoMutationStack = [];
    this.register();
  }

  public beginContinuous<TMutationArgs>(continuousMutation: IContinuousMutation2<TMutationDependencies, TMutationArgs>): Promise<void> {
    return MutatorNew.scheduler.runTask(async () => {
      return this.__beginContinuousImmediate(continuousMutation);
    });
  }
  /**
   * Inner implementation of `beginContinuous()` that does not execute as a schedule task.
   * This exists so that other public functions can run this logic as a part of a different task.
   */
  protected async __beginContinuousImmediate<TMutationArgs>(continuousMutation: IContinuousMutation2<TMutationDependencies, TMutationArgs>, clearRedoStack: boolean = true): Promise<void> {
    if (this.currentDebounceState !== undefined) {
      // If there is a lingering debounce mutation, apply it immediately
      await this.currentDebounceState.onDebounceExpire(true);
    }

    // Validate previous mutation has been applied successfully
    if (
      isContinuousMutation2(this.latestMutation?.instance) &&
      !this.latestMutation.instance.hasBeenApplied
    ) {
      // Tried to call begin on a new mutation before applying the previous (continuous) mutation
      throw new Error(`Cannot begin continuous mutation - Previous continuous mutation has not been applied`);
    }

    if (clearRedoStack) {
      // Making a new mutation - clear all undone mutations
      this.mutationController.clearEveryRedoStack();
    }

    // Push new mutation (not yet applied)
    this.activeMutationStack.push({
      id: this.mutationController.requestMutationId(),
      instance: continuousMutation,
    });

    // Capture undo state before making any updates
    continuousMutation.captureUndoArgs(this.getMutationDependencies());
  }

  public updateContinuous<TMutationArgs>(continuousMutation: IContinuousMutation2<TMutationDependencies, TMutationArgs>, updateArgs: TMutationArgs): Promise<void> {
    return MutatorNew.scheduler.runTask(async () => {
      return this.__updateContinuousImmediate(continuousMutation, updateArgs);
    });
  }
  /**
   * Inner implementation of `updateContinuous()` that does not execute as a schedule task.
   * This exists so that other public functions can run this logic as a part of a different task.
   */
  protected async __updateContinuousImmediate<TMutationArgs>(continuousMutation: IContinuousMutation2<TMutationDependencies, TMutationArgs>, updateArgs: TMutationArgs): Promise<void> {
    // Validate
    if (this.latestMutation?.instance !== continuousMutation) {
      throw new Error(`Cannot update continuous mutation - provided instance is not the latest mutation`);
    }

    // @NOTE runInAction will be useless after an `await`, so called code
    // will need additional `runInAction` calls after async work
    const mutationDependencies = this.getMutationDependencies();
    await runInAction(() => {
      return continuousMutation.updateMutation(mutationDependencies, updateArgs);
    });

    // Capture redo args
    continuousMutation.captureRedoArgs(mutationDependencies, updateArgs);
  }

  /**
   * Apply a continuous mutation instantly. Equivalent to calling `beginContinuous()` followed by `updateContinuous` and then `apply()`
   */
  public async applyInstantly<TMutationArgs>(continuousMutation: IContinuousMutation2<TMutationDependencies, TMutationArgs>, updateArgs: TMutationArgs): Promise<void> {
    return MutatorNew.scheduler.runTask(async () => {
      await this.__beginContinuousImmediate(continuousMutation);
      await this.__updateContinuousImmediate(continuousMutation, updateArgs);
      await this.__applyImmediate(continuousMutation);
    });
  }

  public apply<TMutationArgs>(mutation: IMutation2<TMutationDependencies, TMutationArgs>): Promise<void> {
    return MutatorNew.scheduler.runTask(async () => {
      return this.__applyImmediate(mutation);
    });
  }
  /**
   * Inner implementation of `apply()` that does not execute as a schedule task.
   * This exists so that other public functions can run this logic as a part of a different task.
   */
  protected async __applyImmediate<TMutationArgs>(mutation: IMutation2<TMutationDependencies, TMutationArgs>, clearRedoStack: boolean = true): Promise<void> {
    /* @TODO Throw up some kind of error / graceful failure on exception (clear redo stack?) */
    if (this.currentDebounceState !== undefined) {
      // If there is a lingering debounce mutation, apply it immediately
      await this.currentDebounceState.onDebounceExpire(true);
    }

    // @NOTE Oosh. I'm sorry, this logic got real complicated !!
    if (mutation !== this.latestMutation?.instance) {
      // Applying a new mutation
      if (isContinuousMutation2(mutation)) {
        // Expect when `mutation` is continuous to always == `latestMutation` as continuous mutations are pushed to the stack in `beginContinuous()`
        throw new Error(`Cannot apply continuous mutation - It is not the latest mutation, did you call 'beginContinuous()'?`);
      } else if (
        isContinuousMutation2(this.latestMutation?.instance) &&
        !this.latestMutation.instance.hasBeenApplied
      ) {
        // Tried to call apply on a new mutation before applying the previous (continuous) mutation
        throw new Error(`Cannot apply mutation - Previous continuous mutation has not been applied`);
      } else {
        // New, non-continuous mutation, and previous mutation was either non-continuous, or has been applied

        if (clearRedoStack) {
          // Making a new mutation - clear all undone mutations
          this.mutationController.clearEveryRedoStack();
        }

        this.activeMutationStack.push({
          id: this.mutationController.requestMutationId(),
          instance: mutation,
        });
      }
    } else {
      // `mutation` is the same as `latestMutation`
      // This should only be the case for continuous mutations that are being applied
      if (!isContinuousMutation2(mutation)) {
        throw new Error(`Cannot apply mutation - It has already been applied`);
      } else if (mutation.hasBeenApplied) {
        throw new Error(`Cannot apply continuous mutation - It has already been applied`);
      } else {
        // Continuous mutation that has not yet been applied
        mutation.hasBeenApplied = true;
      }
    }

    const mutationDependencies = this.getMutationDependencies();

    // Store undo state before applying
    // @NOTE only relevant for standard mutations - continuous mutations have had their
    //  state captured in `beginContinuous()`
    if (!isContinuousMutation2(mutation)) {
      mutation.captureUndoArgs(mutationDependencies);
    }

    // Apply mutation
    // @NOTE runInAction will be useless after an `await`, so called code
    // will need additional `runInAction` calls after async work
    await runInAction(() => {
      return mutation.applyMutation(mutationDependencies);
    });

    // @TODO @DEBUG REMOVE
    console.log(`Mutation stack: `, this.activeMutationStack.map((mutation) => mutation.instance.description));

    // Save to disk
    await this.persistChanges();

    // @NOTE runInAction will be useless after an `await`, so called code
    // will need additional `runInAction` calls after async work
    await runInAction(() => {
      if (mutation.afterPersistChanges) {
        return mutation.afterPersistChanges(mutationDependencies);
      }
    });
  }

  public async undo(): Promise<void> {
    /* @TODO Throw up some kind of error / graceful failure on exception (clear redo stack?) */
    return MutatorNew.scheduler.runTask(() => {
      return this.__undoImmediate();
    });
  }

  protected async __undoImmediate(): Promise<void> {
    if (this.activeMutationStack.length === 0) {
      return; // Stack is empty
    }

    if (this.currentDebounceState !== undefined) {
      // If there is a lingering debounce mutation, apply it immediately
      await this.currentDebounceState.onDebounceExpire(true);
    }

    // Undo mutation
    const mutation = this.activeMutationStack[this.activeMutationStack.length - 1];

    // Do not undo if mutation is marked as `promptForUndo` and the user cancels
    if (mutation.instance.promptForUndo) {
      const confirmation = await confirm(`Are you sure you wish to undo '${mutation.instance.description}'?`, {
        kind: 'warning',
        title: 'Confirm undo',
      });
      if (!confirmation) {
        return;
      }
    }

    const mutationDependencies = this.getMutationDependencies();

    await runInAction(() => {
      return mutation.instance.undoMutation(mutationDependencies);
    });

    // Mark continuous mutation as no-longer applied
    if (isContinuousMutation2(mutation.instance)) {
      mutation.instance.hasBeenApplied = false;
    }

    // Move mutation to redo stack
    this.redoMutationStack.push(this.activeMutationStack.pop()!);

    // @TODO @DEBUG REMOVE
    console.log(`Mutation stack: `, this.activeMutationStack.map((mutation) => mutation.instance.description));

    // Save to disk
    await this.persistChanges();

    // @NOTE runInAction will be useless after an `await`, so called code
    // will need additional `runInAction` calls after async work
    await runInAction(() => {
      if (mutation.instance.afterPersistChanges) {
        return mutation.instance.afterPersistChanges(mutationDependencies);
      }
    });
  }

  public async redo(): Promise<void> {
    /* @TODO Throw up some kind of error / graceful failure on exception (clear redo stack?) */
    return MutatorNew.scheduler.runTask(() => {
      return this.__redoImmediate();
    });
  }

  protected async __redoImmediate(): Promise<void> {
    if (this.redoMutationStack.length === 0) {
      return; // Stack is empty
    }

    if (this.currentDebounceState !== undefined) {
      // @NOTE This is a peculiar scenario and I really don't think it is possible
      // However ... if/when it happens, I want it to fail gracefully
      console.error(`Somehow: Redoing a mutation while there is an active debouncing mutation. PLEASE report this to the developers.`);
      // If there is a lingering debounce mutation, apply it immediately
      await this.currentDebounceState.onDebounceExpire(true);
    }

    const mutation = this.redoMutationStack.pop()!;

    if (isContinuousMutation2(mutation.instance)) {
      await this.__beginContinuousImmediate(mutation.instance, false);
      await this.__updateContinuousImmediate(mutation.instance, mutation.instance.redoArgs);
      await this.__applyImmediate(mutation.instance, false /* @NOTE un-necessary option, but just for sanity */);
    } else {
      await this.__applyImmediate(mutation.instance, false);
    }
  }

  public clearRedoStack(): void {
    this.redoMutationStack.splice(0);
  }

  /**
   * Debounce repeated calls to a continuous mutation. The first time this is called, `begin()` will be called
   * on the mutation. Every time this function is called, `update()` will be called (including the first time).
   * After a debounce period has elapsed wherein no further calls to this function are made, `apply()` will be called
   * on the mutation.
   * If this function is called for a different target, or with a different mutation type, the previous debounced mutation (if any)
   * will be immediately applied.
   * @param typeCtor Reference to type/class of the this mutation, for uniquely identifying different mutation operations
   * @param mutationTarget The object being mutated, for uniquely identifying different mutation operations
   * @param createMutation A function that creates a new instance of the mutation
   * @param getUpdateArgs A function that creates an object containing the updateArgs for calling `update()` on the Mutation
   * @param timeoutMs The debounce window length, in milliseconds. Defaults to 500ms.
   */
  public async debounceContinuous<TMutation extends IContinuousMutation2<TMutationDependencies, any>>(
    typeCtor: Constructor<TMutation>,
    mutationTarget: MutationTarget,
    createMutation: () => TMutation,
    getUpdateArgs: () => TMutation extends IContinuousMutation2<TMutationDependencies, infer TUpdateArgs> ? TUpdateArgs : never,
    timeoutMs: number = 500,
  ): Promise<void> {
    return MutatorNew.scheduler.runTask(async () => {
      return this.__debounceContinuousImmediate(
        typeCtor,
        mutationTarget,
        createMutation,
        getUpdateArgs,
        timeoutMs,
      );
    });
  }
  /**
   * Inner implementation of `debounceContinuous()` that does not execute as a schedule task.
   * This exists so that other public functions can run this logic as a part of a different task.
   */
  private async __debounceContinuousImmediate<TMutation extends IContinuousMutation2<TMutationDependencies, any>>(
    typeCtor: Constructor<TMutation>,
    mutationTarget: MutationTarget,
    createMutation: () => TMutation,
    getUpdateArgs: () => TMutation extends IContinuousMutation2<TMutationDependencies, infer TUpdateArgs> ? TUpdateArgs : never,
    timeoutMs: number = 500,
  ): Promise<void> {
    if (this.currentDebounceState === undefined) {
      // Start a new debounced action
      const mutation = createMutation();
      await this.__beginContinuousImmediate(mutation);
      // Invoke update() on mutation once
      const updateArgs = getUpdateArgs();
      await this.__updateContinuousImmediate(mutation, updateArgs);

      // Record current debounce state
      const debounceState = this.currentDebounceState = new CurrentDebounceState(
        typeCtor,
        mutationTarget,
        mutation,
        async (earlyExpire) => {
          // On debounce expire
          this.currentDebounceState = undefined;
          if (earlyExpire) {
            // Early expiration is assumed to be part of an existing scheduler task
            await this.__applyImmediate(mutation);
          } else {
            // Natural expiration is not part of scheduler task, needs to create its own
            await this.apply(mutation);
          }
        },
      );

      // Create debounce and store timeout key for resetting the debounce
      debounceState.timeoutKey = window.setTimeout(() => debounceState.onDebounceExpire(false), timeoutMs);
    } else {
      // Prior debounce state exists
      if (this.currentDebounceState.isSameDebounceAction(typeCtor, mutationTarget)) {
        // This is an update for the same debounced action
        // Invoke update() on mutation
        const updateArgs = getUpdateArgs();
        await this.__updateContinuousImmediate(this.currentDebounceState.mutation as TMutation, updateArgs);
        // Clear previous timeout (debounce)
        window.clearTimeout(this.currentDebounceState.timeoutKey);
        // Create new debounce and store timeout key for resetting the debounce
        this.currentDebounceState.timeoutKey = window.setTimeout(() => this.currentDebounceState!.onDebounceExpire(false), timeoutMs);
      } else {
        // This is a new debounced action, apply the previous action first
        // Apply and expire the previous debounce action immediately
        await this.currentDebounceState.onDebounceExpire(true);

        // Re-invoke this method now that current debounce state has been cleared
        await this.__debounceContinuousImmediate(
          typeCtor,
          mutationTarget,
          createMutation,
          getUpdateArgs,
          timeoutMs,
        );
      }
    }
  }

  public register(): void {
    this.mutationController.registerMutator(this);
  }

  public deregister(): void {
    this.mutationController.deregisterMutator(this);
  }

  protected abstract getMutationDependencies(): TMutationDependencies;
  protected abstract persistChanges(): Promise<void>;

  public get latestMutation(): ActiveMutation<TMutationDependencies> | undefined {
    if (this.activeMutationStack.length === 0) {
      return undefined;
    } else {
      return this.activeMutationStack[this.activeMutationStack.length - 1];
    }
  }

  public get latestUndoneMutation(): ActiveMutation<TMutationDependencies> | undefined {
    if (this.redoMutationStack.length === 0) {
      return undefined;
    } else {
      return this.redoMutationStack[this.redoMutationStack.length - 1];
    }
  }
}
