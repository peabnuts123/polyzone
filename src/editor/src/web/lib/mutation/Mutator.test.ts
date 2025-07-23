import { describe, expect, test } from "vitest";
import { sleep } from '@test/util/sleep';
import { Mutator } from './Mutator';
import { IMutation } from "./IMutation";
import { IContinuousMutation } from "./IContinuousMutation";

describe(Mutator.name, () => {
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
    const mutator = new MockMutator(initialMockStateValue);
    // const mockValueA = 9;
    const updateValues: number[] = [9, 12, 15];
    const finalUpdateValue = updateValues[updateValues.length - 1];
    // const mockValueB = 12;

    const actions: string[] = [];
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
          new SetMockValueMutation(updateValue,
          /* onApply: */({ MockState }) => {
              actions.push(`apply(${updateValue}):${MockState.value}`);
            }),
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
    const mutator = new MockMutator(initialMockStateValue);
    const updateValues: number[] = [9, 12, 15, 20];
    const finalUpdateValue = updateValues[updateValues.length - 1];

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const actions: string[] = [];
    const expectedActions: string[] = [
      'begin:5',          // begin:$current_value
      'update(9):5',      // update($new_value):$current_value
      'update(12):9',
      'update(15):12',
      'update(20):15',
      'apply:20',         // apply:$current_value
    ];

    const continuousMutation = new SetMockValueContinuousMutation(
      ({ MockState }) => actions.push(`begin:${MockState.value}`),
      ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
      ({ MockState }) => actions.push(`apply:${MockState.value}`),
    );

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
    const mutator = new MockMutator(initialMockStateValue);
    const updateValues: number[] = [9, 12, 15, 20];
    const finalUpdateValue = updateValues[updateValues.length - 1];

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const actions: string[] = [];
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
          () => new SetMockValueContinuousMutation(
            ({ MockState }) => actions.push(`begin:${MockState.value}`),
            ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
            ({ MockState }) => actions.push(`apply:${MockState.value}`),
          ),
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
    const mutator = new MockMutator(initialMockStateValue);

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const actions: string[] = [];
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

    // Test
    // Start first debounced mutation
    actions.push(`queue(${firstMutationNewValue}):${mutator.mockState.value}`);
    mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTarget,
      () => new SetMockValueContinuousMutation(
        ({ MockState }) => actions.push(`begin:${MockState.value}`),
        ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
        ({ MockState }) => actions.push(`apply:${MockState.value}`),
      ),
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
    const secondMutation = new SetMockValueContinuousMutation(
      ({ MockState }) => actions.push(`begin:${MockState.value}`),
      ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
      ({ MockState }) => actions.push(`apply:${MockState.value}`),
    );
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
    const mutator = new MockMutator(initialMockStateValue);

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const actions: string[] = [];
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
    mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTargetA,
      () => new SetMockValueContinuousMutation(
        ({ MockState }) => actions.push(`begin:${MockState.value}`),
        ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
        ({ MockState }) => actions.push(`apply:${MockState.value}`),
      ),
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
      () => new SetMockValueContinuousMutation(
        ({ MockState }) => actions.push(`begin:${MockState.value}`),
        ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
        ({ MockState }) => actions.push(`apply:${MockState.value}`),
      ),
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

  test('Beginning another regular mutation while the previous mutation is still debouncing applies the previous mutation immediately', async () => {
    // Setup
    const mockDebounceWindowMs = 100;
    const mockDebounceMutationTarget = {};
    const initialMockStateValue = 5;
    const mutator = new MockMutator(initialMockStateValue);

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const actions: string[] = [];
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
      'apply:10',         // apply:$current_value - @NOTE First mutation applied by calling `debounceContinuous` on second mutation
      'apply(20):10',
    ];

    // Test
    // Start debounced mutation
    actions.push(`queue(${firstMutationNewValue}):${mutator.mockState.value}`);
    mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTarget,
      () => new SetMockValueContinuousMutation(
        ({ MockState }) => actions.push(`begin:${MockState.value}`),
        ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
        ({ MockState }) => actions.push(`apply:${MockState.value}`),
      ),
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
    await mutator.apply(new SetMockValueMutation(secondMutationNewValue, ({ MockState }) => actions.push(`apply(${secondMutationNewValue}):${MockState.value}`)));

    // Assert
    expect(actions).toEqual(expectedActionsAfterSecondMutation);
    expect(mutator.mockState.value).toBe(secondMutationNewValue);
    expect(timesPersisted).toBe(2); // Both mutations persisted
  });

  test('Beginning another continuous mutation before the previous continuous mutation has been applied throws an error', async () => {
    // Setup
    const initialMockStateValue = 5;
    const mutator = new MockMutator(initialMockStateValue);

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
    const mutator = new MockMutator(initialMockStateValue);

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
    const mutator = new MockMutator(initialMockStateValue);

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
    const mutator = new MockMutator(initialMockStateValue);
    const newValue = 15;

    let timesPersisted = 0;
    mutator.persistChangesImplementation = (): Promise<void> => {
      timesPersisted++;
      return Promise.resolve();
    };

    const actions: string[] = [];
    const expectedActions = [
      'begin:5',
      'update(15):5',
      'apply:15',
    ];

    const continuousMutation = new SetMockValueContinuousMutation(
      ({ MockState }) => actions.push(`begin:${MockState.value}`),
      ({ MockState }, { value }) => actions.push(`update(${value}):${MockState.value}`),
      ({ MockState }) => actions.push(`apply:${MockState.value}`),
    );

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
    const mutator = new MockMutator(initialMockStateValue);

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
    const mutator = new MockMutator(initialMockStateValue);

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
    const mutator = new MockMutator(initialMockStateValue);

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
    const mutator = new MockMutator(initialMockStateValue);
    const newValue = 10;

    const actions: string[] = [];
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
    const mutation = new SetMockValueMutation(
      newValue,
      ({ MockState }) => actions.push(`apply(${newValue}):${MockState.value}`),
    );
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
interface MockMutationArgs {
  MockState: MockState;
}

class MockMutator extends Mutator<MockMutationArgs> {
  public mockState: MockState;

  public persistChangesImplementation: (() => Promise<void>) | undefined;

  public constructor(mockStateInitialValue: number = 0) {
    super();
    this.mockState = {
      value: mockStateInitialValue,
    };
  }

  protected getMutationArgs(): MockMutationArgs {
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

interface IMockMutation extends IMutation<MockMutationArgs> {
}

interface IContinuousMockMutation<TUpdateArgs> extends IMockMutation, IContinuousMutation<MockMutationArgs, TUpdateArgs> {
}

class SetMockValueMutation implements IMockMutation {
  // Mutation args
  private newValue: number;
  private onApply: ((args: MockMutationArgs) => void) | undefined;
  private onUndo: ((args: MockMutationArgs) => void) | undefined;

  // Undo state
  private oldValue: number | undefined;

  public afterPersistChanges?: ((args: MockMutationArgs) => Promise<void> | void) | undefined;

  public constructor(
    newValue: number,
    onApply: ((args: MockMutationArgs) => void) | undefined = undefined,
    onUndo: ((args: MockMutationArgs) => void) | undefined = undefined,
  ) {
    this.newValue = newValue;
    this.onApply = onApply;
    this.onUndo = onUndo;
  }

  apply(args: MockMutationArgs): void {
    const { MockState } = args;
    if (this.onApply !== undefined) {
      this.onApply(args);
    }

    // Store undo value
    this.oldValue = MockState.value;

    // Update mock state
    MockState.value = this.newValue;

  }

  undo(args: MockMutationArgs): void {
    const { MockState } = args;
    if (this.onUndo !== undefined) {
      this.onUndo(args);
    }

    if (this.oldValue === undefined) throw new Error(`No undo state found - has the mutation been applied?`);
    MockState.value = this.oldValue;
    this.oldValue = undefined;

  }

  // afterPersistChanges?: ((args: MockMutationArgs) => Promise<void> | void) | undefined;

  get description(): string {
    return `Set mock value`;
  }
}

interface SetMockValueContinuousMutationUpdateArgs {
  value: number;
}
class SetMockValueContinuousMutation implements IContinuousMockMutation<SetMockValueContinuousMutationUpdateArgs> {
  // State
  private _hasBeenApplied: boolean = false;
  private onBegin: ((args: MockMutationArgs) => void) | undefined;
  private onUpdate: ((args: MockMutationArgs, updateArgs: SetMockValueContinuousMutationUpdateArgs) => void) | undefined;
  private onApply: ((args: MockMutationArgs) => void) | undefined;
  private onUndo: ((args: MockMutationArgs) => void) | undefined;

  // Undo state
  private oldValue: number | undefined;

  public afterPersistChanges?: ((args: MockMutationArgs) => Promise<void> | void) | undefined;

  public constructor(
    onBegin: ((args: MockMutationArgs) => void) | undefined = undefined,
    onUpdate: ((args: MockMutationArgs, updateArgs: SetMockValueContinuousMutationUpdateArgs) => void) | undefined = undefined,
    onApply: ((args: MockMutationArgs) => void) | undefined = undefined,
    onUndo: ((args: MockMutationArgs) => void) | undefined = undefined,
  ) {
    this.onBegin = onBegin;
    this.onUpdate = onUpdate;
    this.onApply = onApply;
    this.onUndo = onUndo;
  }

  begin(args: MockMutationArgs): void {
    const { MockState } = args;
    if (this.onBegin !== undefined) {
      this.onBegin(args);
    }

    // Store undo value
    this.oldValue = MockState.value;
  }

  update(args: MockMutationArgs, updateArgs: SetMockValueContinuousMutationUpdateArgs): void {
    const { MockState } = args;
    const { value } = updateArgs;

    if (this.onUpdate !== undefined) {
      this.onUpdate(args, updateArgs);
    }

    // Update mock state
    MockState.value = value;
  }

  apply(args: MockMutationArgs): void {
    if (this.onApply !== undefined) {
      this.onApply(args);
    }
    // @NOTE No-op
  }

  undo(args: MockMutationArgs): void {
    const { MockState } = args;
    if (this.onUndo !== undefined) {
      this.onUndo(args);
    }
    if (this.oldValue === undefined) throw new Error(`No undo state found - has the mutation been applied?`);
    MockState.value = this.oldValue;
    this.oldValue = undefined;
  }

  get description(): string {
    return `Set mock value (continuous)`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
