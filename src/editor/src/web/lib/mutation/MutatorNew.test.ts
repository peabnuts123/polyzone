import { describe, expect, test } from "vitest";
import { sleep } from "@test/util";
import { MutatorNew } from './MutatorNew';
import { BaseMutation, IMutation2 } from "./IMutation";
import { BaseContinuousMutation, IContinuousMutation2 } from "./IContinuousMutation";
import { MutationController } from "./MutationController";

/*
  @TODO
  - We should write tests for MutatorNew
  - Add tests for undo
  - Add tests for redo
  - Write tests for MutationController
  - Add tests for redo in all the mutations I guessssssss
 */

/*
  @TODO Test backlog
    - Undoing a standard mutation reverts state to initial value
    - Undoing a continuous mutation reverts state to initial value before first update
      - Marks `hasBeenApplied` = false
    - Calling undo twice undoes two mutations
    - Calling undo while a continuous mutation is debouncing does (???)
    - Calling undo on an empty stack safely does nothing
    - Calling undo when `promptForUndo` is set calls confirm()
    - Cancelling `confirm()` when `promptForUndo` is set does not apply the mutation
    - `afterPersistChanges` is called after undo is called

    - Redoing a standard mutation applies it just as it was
    - Redoing a continuous mutation applies it as it was after its last update
      - Marks `hasBeenApplied` = true
    - Calling redo twice redoes two mutations
    - Calling redo while a continuous mutation is debouncing does (???)
    - Redoing an empty undo stack safely does nothing
    - `afterPersistChanges` is called after redo is called
 */

describe(MutatorNew.name, () => {
  test('Applying a mutation applies it', async () => {
    // Setup
    const initialMockStateValue = 5;
    const mutator = new MockMutator(initialMockStateValue);
    const newMockStateValue = 9;

    // Test
    await mutator.apply(new SetMockValueMutation(newMockStateValue));

    // Assert
    expect(mutator.mockState.value).toBe(newMockStateValue);
  });

  test('Applying several mutations applies them in series', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);
    const updateValues: number[] = [9, 12, 15];
    const finalUpdateValue = updateValues[updateValues.length - 1];

    const expectedActions: string[] = [
      'queue(9):5',       // queue($new_value):$current_value
      'apply(9):5',       // apply($new_value):$current_value
      'queue(12):9',
      'queue(15):9',
      'apply(12):9',
      'apply(15):12',
    ];

    // Test
    const mutationPromises: Promise<void>[] = [];
    for (const updateValue of updateValues) {
      actions.push(`queue(${updateValue}):${mutator.mockState.value}`);
      mutationPromises.push(
        mutator.apply(
          new SetMockValueMutation(updateValue),
        ).then(() => {
          // After each mutation resolves, expect the value to be updated
          expect(mutator.mockState.value).toBe(updateValue);
        }),
      );
    }

    // Wait for mutations to all finish
    await Promise.all(mutationPromises);

    // Assert
    expect(actions).toEqual(expectedActions);
    expect(mutator.mockState.value).toBe(finalUpdateValue);
  });

  test('Continuous mutation mutates state, only persists on apply', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);
    const updateValues: number[] = [9, 12, 15, 20];
    const finalUpdateValue = updateValues[updateValues.length - 1];

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const expectedActions: string[] = [
      'begin:5',          // begin:$current_value
      'update(9):5',      // update($new_value):$current_value
      'update(12):9',
      'update(15):12',
      'update(20):15',
      'apply:20',         // apply:$current_value
    ];

    const continuousMutation = new SetMockValueContinuousMutation();

    // Test
    /* Continuous phase: begin */
    const mutationPromises: Promise<void>[] = [];
    mutationPromises.push(
      mutator.beginContinuous(continuousMutation),
    );

    /* Continuous phase: update... */
    for (const updateValue of updateValues) {
      mutationPromises.push(
        mutator.updateContinuous(continuousMutation, { value: updateValue })
          .then(() => {
            expect(mutator.mockState.value).toBe(updateValue); // State should be updated immediately
          }),
      );
    }

    // Wait for all work to settle
    await Promise.all(mutationPromises);
    expect(timesPersisted).toBe(0); // No persistence yet

    /* Continuous phase: apply */
    await mutator.apply(continuousMutation);

    // Assert
    expect(actions).toEqual(expectedActions);
    expect(mutator.mockState.value).toBe(finalUpdateValue);
    expect(timesPersisted).toBe(1);
  });

  test('Calling `debounceContinuous()` repeatedly updates the state, only applies after debounce window', async () => {
    // Setup
    const mockDebounceWindowMs = 100;
    const mockDebounceMutationTarget = {};
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);
    const updateValues: number[] = [9, 12, 15, 20];
    const finalUpdateValue = updateValues[updateValues.length - 1];

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const expectedActions: string[] = [
      'queue(9):5',       // queue($new_value):$current_value
      'begin:5',          // begin:$current_value
      'queue(12):5',
      'queue(15):5',
      'queue(20):5',
      'update(9):5',      // update($new_value):$current_value
      'update(12):9',
      'update(15):12',
      'update(20):15',
      'apply:20',         // apply:$current_value
    ];

    // Test
    const mutationPromises: Promise<void>[] = [];
    for (const updateValue of updateValues) {
      // Queue several invocations of debounceContinuous
      actions.push(`queue(${updateValue}):${mutator.mockState.value}`);
      mutationPromises.push(
        mutator.debounceContinuous(
          SetMockValueContinuousMutation,
          mockDebounceMutationTarget,
          () => new SetMockValueContinuousMutation(),
          () => ({ value: updateValue }),
          mockDebounceWindowMs,
        )
          .then(() => {
            // After each debounce resolves, expect the value to be updated
            expect(mutator.mockState.value).toBe(updateValue);
          }),
      );
    }

    // Wait for all debounceContinuous invocations to complete
    await Promise.all(mutationPromises);

    // Apply should not have been called yet
    expect(actions.some((action) => action.startsWith('apply'))).toBe(false);
    expect(timesPersisted).toBe(0);

    // Wait for debounce timeout before asserting
    await sleep(mockDebounceWindowMs + 50);

    // Assert
    // Need to wrap in a Promise so that vitest knows it needs to wait
    expect(actions).toEqual(expectedActions);
    expect(mutator.mockState.value).toBe(finalUpdateValue);
    expect(timesPersisted).toBe(1);
  });

  test('Beginning another continuous mutation while the previous mutation is still debouncing applies the previous mutation immediately', async () => {
    // Setup
    const mockDebounceWindowMs = 100;
    const mockDebounceMutationTarget = {};
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const firstMutationNewValue = 10;
    const secondMutationNewValue = 20;
    const expectedActionsBeforeSecondMutation: string[] = [
      'queue(10):5',      // queue($new_value):$current_value
      'begin:5',          // begin:$current_value
      'update(10):5',     // update($new_value):$current_value
      // @NOTE apply() has not been called yet
    ];
    const expectedActionsImmediatelyAfterSecondMutation: string[] = [
      ...expectedActionsBeforeSecondMutation,
      'queue(20):10',
      'begin:10',
      'apply:10',         // apply:$current_value - @NOTE First mutation applied by calling `debounceContinuous` on second mutation
      'update(20):10',
    ];

    // Test
    // Start first debounced mutation
    actions.push(`queue(${firstMutationNewValue}):${mutator.mockState.value}`);
    void mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTarget,
      () => new SetMockValueContinuousMutation(),
      () => ({ value: firstMutationNewValue }),
      mockDebounceWindowMs,
    );

    // Wait a bit, but NOT long enough for debounced action to fire
    await sleep(mockDebounceWindowMs / 2);

    // @NOTE Expect first mutation to have called begin and update but NOT apply
    expect(actions).toEqual(expectedActionsBeforeSecondMutation);
    expect(timesPersisted).toBe(0);

    // Begin second mutation before first mutation's debounce expires
    actions.push(`queue(${secondMutationNewValue}):${mutator.mockState.value}`);
    const secondMutation = new SetMockValueContinuousMutation();
    await mutator.beginContinuous(secondMutation);
    await mutator.updateContinuous(secondMutation, { value: secondMutationNewValue });

    // Assert
    expect(actions).toEqual(expectedActionsImmediatelyAfterSecondMutation);
    expect(mutator.mockState.value).toBe(secondMutationNewValue);
    expect(timesPersisted).toBe(1); // First mutation persisted only
  });

  test('Calling `debounceContinuous()` with another continuous mutation while the previous mutation is still debouncing applies the previous mutation immediately', async () => {
    // Setup
    const mockDebounceWindowMs = 100;
    const mockDebounceMutationTargetA = {};
    const mockDebounceMutationTargetB = {};
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const firstMutationNewValue = 10;
    const secondMutationNewValue = 20;
    const expectedActionsBeforeSecondMutation: string[] = [
      'queue(10):5',      // queue($new_value):$current_value
      'begin:5',          // begin:$current_value
      'update(10):5',     // update($new_value):$current_value
      // @NOTE apply() has not been called yet
    ];
    const expectedActionsImmediatelyAfterSecondMutation: string[] = [
      ...expectedActionsBeforeSecondMutation,
      'queue(20):10',
      'apply:10',         // apply:$current_value - @NOTE First mutation applied by calling `debounceContinuous` on second mutation
      'begin:10',
      'update(20):10',
    ];
    const expectedActionsAfterSecondMutationHasDebounced: string[] = [
      ...expectedActionsImmediatelyAfterSecondMutation,
      'apply:20',
    ];

    // Test
    // Start first debounced mutation
    actions.push(`queue(${firstMutationNewValue}):${mutator.mockState.value}`);
    void mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTargetA,
      () => new SetMockValueContinuousMutation(),
      () => ({ value: firstMutationNewValue }),
      mockDebounceWindowMs,
    );

    // Wait a bit, but NOT long enough for debounced action to fire
    await sleep(mockDebounceWindowMs / 2);

    // @NOTE Expect first mutation to have called begin and update but NOT apply
    expect(actions).toEqual(expectedActionsBeforeSecondMutation);
    expect(timesPersisted).toBe(0);

    // Call second mutation before first mutation's debounce expires
    actions.push(`queue(${secondMutationNewValue}):${mutator.mockState.value}`);
    await mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTargetB,
      () => new SetMockValueContinuousMutation(),
      () => ({ value: secondMutationNewValue }),
      mockDebounceWindowMs,
    );

    // Assert
    expect(actions).toEqual(expectedActionsImmediatelyAfterSecondMutation);
    expect(mutator.mockState.value).toBe(secondMutationNewValue);
    expect(timesPersisted).toBe(1); // First mutation persisted

    // Wait for second mutation's debounce timer
    await sleep(mockDebounceWindowMs + 50);

    expect(actions).toEqual(expectedActionsAfterSecondMutationHasDebounced);
    expect(timesPersisted).toBe(2);
  });

  test('Apply another regular mutation while the previous mutation is still debouncing applies the previous mutation immediately', async () => {
    // Setup
    const mockDebounceWindowMs = 100;
    const mockDebounceMutationTarget = {};
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const firstMutationNewValue = 10;
    const secondMutationNewValue = 20;
    const expectedActionsBeforeSecondMutation: string[] = [
      'queue(10):5',      // queue($new_value):$current_value
      'begin:5',          // begin:$current_value
      'update(10):5',     // update($new_value):$current_value
      // @NOTE apply() has not been called yet
    ];
    const expectedActionsAfterSecondMutation: string[] = [
      ...expectedActionsBeforeSecondMutation,
      'queue(20):10',
      'apply(20):10',     // apply($new_value):$current_value
      'apply:10',         // apply:$current_value - @NOTE First mutation applied by calling `debounceContinuous` on second mutation
    ];

    // Test
    // Start debounced mutation
    actions.push(`queue(${firstMutationNewValue}):${mutator.mockState.value}`);
    void mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTarget,
      () => new SetMockValueContinuousMutation(),
      () => ({ value: firstMutationNewValue }),
      mockDebounceWindowMs,
    );

    // Wait a bit, but NOT long enough for debounced action to fire
    await sleep(mockDebounceWindowMs / 2);

    // @NOTE Expect first mutation to have called begin and update but NOT apply
    expect(actions).toEqual(expectedActionsBeforeSecondMutation);
    expect(timesPersisted).toBe(0);

    // Apply regular mutation before first mutation's debounce expires
    actions.push(`queue(${secondMutationNewValue}):${mutator.mockState.value}`);
    await mutator.apply(new SetMockValueMutation(secondMutationNewValue));

    // Assert
    expect(actions).toEqual(expectedActionsAfterSecondMutation);
    expect(mutator.mockState.value).toBe(secondMutationNewValue);
    expect(timesPersisted).toBe(2); // Both mutations persisted
  });

  test('Beginning another continuous mutation before the previous continuous mutation has been applied throws an error', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator } = createMockMutator(initialMockStateValue);

    const firstContinuousMutation = new SetMockValueContinuousMutation();
    const secondContinuousMutation = new SetMockValueContinuousMutation();

    // Test
    // Start first mutation
    await mutator.beginContinuous(firstContinuousMutation);
    await mutator.updateContinuous(firstContinuousMutation, { value: 10 });
    // @NOTE Do not apply first mutation yet

    // Attempt to begin a second mutation before applying the first
    const testFunc = async (): Promise<void> => {
      await mutator.beginContinuous(secondContinuousMutation);
    };

    // Assert
    await expect(testFunc).rejects.toThrow('Cannot begin continuous mutation - Previous continuous mutation has not been applied');
  });

  test('Updating a continuous mutation that is not the latest mutation throws an error', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator } = createMockMutator(initialMockStateValue);

    const firstContinuousMutation = new SetMockValueContinuousMutation();
    const secondContinuousMutation = new SetMockValueContinuousMutation();

    // Test
    // Apply first mutation
    await mutator.beginContinuous(firstContinuousMutation);
    await mutator.updateContinuous(firstContinuousMutation, { value: 10 });
    await mutator.apply(firstContinuousMutation);

    // Start a second mutation
    await mutator.beginContinuous(secondContinuousMutation); // Begin second mutation

    // Attempt to update the first mutation
    const testFunc = async (): Promise<void> => {
      await mutator.updateContinuous(firstContinuousMutation, { value: 20 });
    };

    // Assert
    await expect(testFunc).rejects.toThrow('Cannot update continuous mutation - provided instance is not the latest mutation');
  });

  test('Calling `apply()` on a continuous mutation that is not the latest mutation throws an error', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator } = createMockMutator(initialMockStateValue);

    const firstContinuousMutation = new SetMockValueContinuousMutation();
    const secondContinuousMutation = new SetMockValueContinuousMutation();

    // Test
    // Apply first mutation
    await mutator.beginContinuous(firstContinuousMutation);
    await mutator.updateContinuous(firstContinuousMutation, { value: 10 });
    await mutator.apply(firstContinuousMutation); // Apply first mutation

    // Start a second mutation
    await mutator.beginContinuous(secondContinuousMutation); // Begin second mutation

    // Attempt to apply the first mutation again
    const testFunc = async (): Promise<void> => {
      await mutator.apply(firstContinuousMutation);
    };

    // Assert
    await expect(testFunc).rejects.toThrow('Cannot apply continuous mutation - It is not the latest mutation, did you call \'beginContinuous()\'?');
  });

  test('Calling `applyInstantly()` on a continuous mutation applies the mutation instantly', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);
    const newValue = 15;

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const expectedActions = [
      'begin:5',
      'update(15):5',
      'apply:15',
    ];

    const continuousMutation = new SetMockValueContinuousMutation();

    // Test
    await mutator.applyInstantly(continuousMutation, { value: newValue });

    // Assert
    expect(actions).toEqual(expectedActions);
    expect(mutator.mockState.value).toBe(newValue);
    expect(timesPersisted).toBe(1);
    expect(continuousMutation.hasBeenApplied).toBe(true);
  });

  test('Calling `apply()` on a regular mutation before the previous continuous mutation has been applied throws an error', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator } = createMockMutator(initialMockStateValue);

    const continuousMutation = new SetMockValueContinuousMutation();
    const regularMutation = new SetMockValueMutation(10);

    // Test
    // Begin a continuous mutation
    await mutator.beginContinuous(continuousMutation);
    await mutator.updateContinuous(continuousMutation, { value: 10 });

    // Attempt to apply a regular mutation before applying the continuous mutation
    const testFunc = async (): Promise<void> => {
      await mutator.apply(regularMutation);
    };

    // Assert
    await expect(testFunc).rejects.toThrow('Cannot apply mutation - Previous continuous mutation has not been applied');
  });

  test('Calling `apply()` on a regular mutation twice throws an error', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator } = createMockMutator(initialMockStateValue);

    const mutation = new SetMockValueMutation(10);

    // Test
    // Apply the mutation
    await mutator.apply(mutation);

    // Attempt to apply the same mutation again
    const testFunc = async (): Promise<void> => {
      await mutator.apply(mutation);
    };

    // Assert
    await expect(testFunc).rejects.toThrow('Cannot apply mutation - It has already been applied');
  });

  test('Calling `apply()` on a continuous mutation twice throws an error', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator } = createMockMutator(initialMockStateValue);

    const continuousMutation = new SetMockValueContinuousMutation();

    // Test
    // Apply a mutation
    await mutator.beginContinuous(continuousMutation);
    await mutator.updateContinuous(continuousMutation, { value: 10 });
    await mutator.apply(continuousMutation);

    // Attempt to apply the same mutation again
    const testFunc = async (): Promise<void> => {
      await mutator.apply(continuousMutation);
    };

    // Assert
    await expect(testFunc).rejects.toThrow('Cannot apply continuous mutation - It has already been applied');
  });

  test('Mutation with `afterPersistChanges()` is called after `persistChanges()` is called', async () => {
    // Setup
    const initialMockStateValue = 5;
    const { mutator, actions } = createMockMutator(initialMockStateValue);
    const newValue = 10;

    const expectedActions: string[] = [
      'queue(10):5',          // queue:$current_value
      'apply(10):5',          // apply:$current_value
      'persistChanges',
      'afterPersistChanges',
    ];

    // Record when `persistChanges()` is called
    mutator.persistChangesImplementation = (): Promise<void> => {
      actions.push('persistChanges');
      return Promise.resolve();
    };

    // Create a mutation
    const mutation = new SetMockValueMutation(newValue);
    // Set `afterPersistChanges` to record when it is called
    mutation.afterPersistChanges = () => {
      actions.push('afterPersistChanges');
      return Promise.resolve();
    };

    // Test
    // Apply mutation
    actions.push(`queue(${newValue}):${mutator.mockState.value}`);
    await mutator.apply(mutation);

    // Assert
    expect(actions).toEqual(expectedActions);
    expect(mutator.mockState.value).toBe(newValue);
  });
});

interface MockState {
  value: number;
}
interface MockMutationDependencies {
  MockState: MockState;
}

class MockMutator extends MutatorNew<MockMutationDependencies> {
  public mockState: MockState;

  public onBegin: ((args: MockMutationDependencies, continuousMutation: IContinuousMutation2<MockMutationDependencies, unknown>) => void) | undefined;
  public onUpdate: ((args: MockMutationDependencies, continuousMutation: IContinuousMutation2<MockMutationDependencies, unknown>, updateArgs: unknown) => void) | undefined;
  public onApply: ((args: MockMutationDependencies, mutation: IMutation2<MockMutationDependencies, unknown>) => void) | undefined;
  public onUndo: ((args: MockMutationDependencies, mutation: IMutation2<MockMutationDependencies, unknown>) => void) | undefined;

  public persistChangesImplementation: (() => Promise<void>) | undefined;

  public constructor(mockStateInitialValue: number = 0) {
    super(new MutationController());
    this.mockState = {
      value: mockStateInitialValue,
    };
  }

  protected override __beginContinuousImmediate<TMutationArgs>(continuousMutation: IContinuousMutation2<MockMutationDependencies, TMutationArgs>, clearRedoStack?: boolean): Promise<void> {
    this.onBegin?.(this.getMutationDependencies(), continuousMutation);
    return super.__beginContinuousImmediate(continuousMutation);
  }

  public override __updateContinuousImmediate<TMutationArgs>(continuousMutation: IContinuousMutation2<MockMutationDependencies, TMutationArgs>, updateArgs: TMutationArgs): Promise<void> {
    this.onUpdate?.(this.getMutationDependencies(), continuousMutation, updateArgs);
    return super.__updateContinuousImmediate(continuousMutation, updateArgs);
  }

  public override __applyImmediate<TMutationArgs>(mutation: IMutation2<MockMutationDependencies, TMutationArgs>): Promise<void> {
    this.onApply?.(this.getMutationDependencies(), mutation);
    return super.__applyImmediate(mutation);
  }

  public override async __undoImmediate(): Promise<void> {
    const mutation = this.latestMutation;
    if (mutation === undefined) throw new Error(`Cannot undo - no mutation has been applied`);
    await super.__undoImmediate();
    this.onUndo?.(this.getMutationDependencies(), mutation.instance);
  }

  protected getMutationDependencies(): MockMutationDependencies {
    return {
      MockState: this.mockState,
    };
  }
  protected persistChanges(): Promise<void> {
    if (this.persistChangesImplementation !== undefined) {
      return this.persistChangesImplementation();
    }
    return Promise.resolve();
  }
}

function createMockMutator(mockStateInitialValue: number): MockMutatorTestState {
  const mockMutator = new MockMutator(mockStateInitialValue);

  return new MockMutatorTestState(mockMutator);
}
/**
 * Wrapper around MockMutator that sets up common logic, tracking the
 * order of mutation calls, etc.
 */
class MockMutatorTestState {
  public actions: string[] = [];
  public readonly mutator: MockMutator;

  public constructor(mutator: MockMutator) {
    this.mutator = mutator;

    mutator.onBegin = (args, continuousMutation) => this.onMutatorBegin(args, continuousMutation);
    mutator.onUpdate = (args, continuousMutation, updateArgs) => this.onMutatorUpdate(args, continuousMutation, updateArgs);
    mutator.onApply = (args, mutation) => this.onMutatorApply(args, mutation);
    mutator.onUndo = (args, mutation) => this.onMutatorUndo(args, mutation);
  }

  private onMutatorBegin({ MockState }: MockMutationDependencies, continuousMutation: IContinuousMutation2<MockMutationDependencies, unknown>): void {
    if (continuousMutation instanceof SetMockValueContinuousMutation) {
      this.actions.push(`begin:${MockState.value}`);
    } else {
      throw new Error(`Unimplemented mock mutation type: ${continuousMutation.constructor.name}`);
    }
  }

  private onMutatorUpdate<TMutationArgs>({ MockState }: MockMutationDependencies, continuousMutation: IContinuousMutation2<MockMutationDependencies, TMutationArgs>, updateArgs: TMutationArgs): void {
    if (continuousMutation instanceof SetMockValueContinuousMutation) {
      this.actions.push(`update(${(updateArgs as SetMockValueContinuousMutationUpdateArgs).value}):${MockState.value}`);
    } else {
      throw new Error(`Unimplemented mock mutation type: ${continuousMutation.constructor.name}`);
    }
  }

  private onMutatorApply<TMutationArgs>({ MockState }: MockMutationDependencies, mutation: IMutation2<MockMutationDependencies, TMutationArgs>): void {
    if (mutation instanceof SetMockValueMutation) {
      this.actions.push(`apply(${mutation.getArgs().value}):${MockState.value}`);
    } else if (mutation instanceof SetMockValueContinuousMutation) {
      this.actions.push(`apply:${MockState.value}`);
    } else {
      throw new Error(`Unimplemented mock mutation type: ${mutation.constructor.name}`);
    }
  }

  private onMutatorUndo({ MockState }: MockMutationDependencies, mutation: IMutation2<MockMutationDependencies, unknown>): void {
    if (mutation instanceof SetMockValueMutation || mutation instanceof SetMockValueContinuousMutation) {
      this.actions.push(`undo:${MockState.value}`);
    } else {
      throw new Error(`Unimplemented mock mutation type: ${mutation.constructor.name}`);
    }
  }
}

abstract class BaseMockMutation<TMutationArgs = void> extends BaseMutation<MockMutationDependencies, TMutationArgs> {
}

abstract class BaseContinuousMockMutation<TMutationArgs> extends BaseContinuousMutation<MockMutationDependencies, TMutationArgs> {
}

interface SetMockValueMutationArgs {
  value: number;
}

class SetMockValueMutation extends BaseMockMutation<SetMockValueMutationArgs> {
  public override afterPersistChanges: ((dependencies: MockMutationDependencies) => Promise<void> | void) = () => { };

  public constructor(newValue: number) {
    super({
      value: newValue,
    });
  }

  // @NOTE Type laundering hacks to expose private property
  public getArgs(): SetMockValueMutationArgs {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (this as any).args as SetMockValueMutationArgs;
  }

  apply({ MockState }: MockMutationDependencies, { value }: SetMockValueMutationArgs): void {
    // Update mock state
    MockState.value = value;
  }

  protected override getUndoArgs({ MockState }: MockMutationDependencies): SetMockValueMutationArgs {
    return {
      value: MockState.value,
    };
  }

  get description(): string {
    return `Set mock value`;
  }
}

interface SetMockValueContinuousMutationUpdateArgs {
  value: number;
}
class SetMockValueContinuousMutation extends BaseContinuousMockMutation<SetMockValueContinuousMutationUpdateArgs> {
  public override afterPersistChanges: ((args: MockMutationDependencies) => Promise<void> | void) = () => { };

  public override update({ MockState }: MockMutationDependencies, { value }: SetMockValueContinuousMutationUpdateArgs): void {
    // Update mock state
    MockState.value = value;
  }

  public override apply(_dependencies: MockMutationDependencies): void {
    // @NOTE No-op
  }

  protected override getUndoArgs({ MockState }: MockMutationDependencies): SetMockValueMutationArgs {
    return {
      value: MockState.value,
    };
  }

  get description(): string {
    return `Set mock value (continuous)`;
  }
}
