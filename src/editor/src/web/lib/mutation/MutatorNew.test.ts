import { describe, expect, test, vi } from "vitest";
import { sleep } from "@test/util";
import { MutatorNew } from './MutatorNew';
import { BaseMutation, IMutation2 } from "./IMutation";
import { BaseContinuousMutation, IContinuousMutation2 } from "./IContinuousMutation";
import { MutationController } from "./MutationController";

// Mock the `confirm()` from @tauri-apps/plugin-dialog
const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: mocks.confirm,
}));


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
    await mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTarget,
      () => new SetMockValueContinuousMutation(),
      () => ({ value: firstMutationNewValue }),
      mockDebounceWindowMs,
    );

    // @NOTE do not wait for debounce to elapse

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
    await mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTargetA,
      () => new SetMockValueContinuousMutation(),
      () => ({ value: firstMutationNewValue }),
      mockDebounceWindowMs,
    );

    // @NOTE do not wait for debounce to elapse

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
    await mutator.debounceContinuous(
      SetMockValueContinuousMutation,
      mockDebounceMutationTarget,
      () => new SetMockValueContinuousMutation(),
      () => ({ value: firstMutationNewValue }),
      mockDebounceWindowMs,
    );

    // @NOTE do not wait for debounce to elapse

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

  describe("Undo", () => {
    test("Undoing a standard mutation reverts state to initial value", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      const newMockStateValue = 10;
      const mutation = new SetMockValueMutation(newMockStateValue);

      await mutator.apply(mutation);

      const expectedActions = [
        `apply(10):5`,
        `undo:5`,
      ];

      // Test
      await mutator.undo();

      // Assert
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Undoing a continuous mutation reverts state to initial value before first update", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      // const newMockStateValue = 10;
      const mutation = new SetMockValueContinuousMutation();

      // Fully apply continuous mutation, updating several times
      await mutator.beginContinuous(mutation);
      const finalUpdateValue = 30;
      for (let i = 10; i <= finalUpdateValue; i += 10) {
        await mutator.updateContinuous(mutation, { value: i });
      }
      await mutator.apply(mutation);

      const expectedActions = [
        `begin:5`,
        `update(10):5`,
        `update(20):10`,
        `update(30):20`,
        `apply:30`,
        `undo:5`,
      ];

      expect(mutation.hasBeenApplied).toBe(true);

      // Test
      await mutator.undo();

      // Assert
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
      expect(mutation.hasBeenApplied).toBe(false);
    });

    test("Calling undo twice undoes two mutations", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      // Apply two mutations
      const newMockStateValues = [10, 20];
      for (const newMockStateValue of newMockStateValues) {
        const mutation = new SetMockValueMutation(newMockStateValue);
        await mutator.apply(mutation);
      }

      const expectedActions = [
        `apply(10):5`,
        `apply(20):10`,
        `undo:10`,
        `undo:5`,
      ];

      // Test
      // Undo two mutations
      await mutator.undo();
      await mutator.undo();

      // Assert
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Calling undo while a continuous mutation is debouncing applies it and then undoes it", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      const newMockStateValue = 10;
      const mockDebounceMutationTarget = {};
      const mockDebounceWindowMs = 100;
      // Begin debounced update
      await mutator.debounceContinuous(
        SetMockValueContinuousMutation,
        mockDebounceMutationTarget,
        () => new SetMockValueContinuousMutation(),
        () => ({ value: newMockStateValue }),
        mockDebounceWindowMs,
      );

      // @NOTE do not wait for debounce to elapse

      const expectedActions = [
        `begin:5`,
        `update(10):5`,
        `apply:10`,
        `undo:5`,
      ];

      // Test
      await mutator.undo();

      // Assert
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Calling undo on an empty stack safely does nothing", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      const expectedActions: string[] = [
      ];

      // Test
      await mutator.undo();

      // Assert
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Calling undo when `promptForUndo` is set confirms with the user", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      const newMockStateValue = 10;
      const mutation = new SetMockValueMutation(newMockStateValue);

      mutation.promptForUndo = true;
      mocks.confirm.mockResolvedValue(true);

      await mutator.apply(mutation);

      const expectedActions = [
        `apply(10):5`,
        `undo:5`,
      ];

      // Test
      await mutator.undo();

      // Assert
      expect(mocks.confirm).toHaveBeenCalled();
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Cancelling `confirm()` when `promptForUndo` is set does not undo the mutation", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      const newMockStateValue = 10;
      const mutation = new SetMockValueMutation(newMockStateValue);

      mutation.promptForUndo = true;
      mocks.confirm.mockResolvedValue(false);

      await mutator.apply(mutation);

      const expectedActions = [
        `apply(10):5`,
        `undo:10`, // @NOTE Undo was called, but the value was not modified
      ];

      // Test
      await mutator.undo();

      // Assert
      expect(mocks.confirm).toHaveBeenCalled();
      expect(mutator.mockState.value).toBe(newMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test('`persistChanges` and `afterPersistChanges` are called after undo is called', async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      mutator.persistChangesImplementation = (): Promise<void> => {
        actions.push('persistChanges');
        return Promise.resolve();
      };

      // Create a mutation
      const newValue = 10;
      const mutation = new SetMockValueMutation(newValue);
      mutation.afterPersistChanges = () => {
        actions.push('afterPersistChanges');
        return Promise.resolve();
      };

      const expectedActions: string[] = [
        'apply(10):5',          // apply:$current_value
        'persistChanges',
        'afterPersistChanges',
        'persistChanges',       // @NOTE from undo()
        'afterPersistChanges',
        `undo:5`,
      ];

      await mutator.apply(mutation);

      // Test
      await mutator.undo();

      // Assert
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
    });
  });

  describe("Redo", () => {
    test("Redoing a standard mutation re-applies it as it was", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      const newMockStateValue = 10;
      const mutation = new SetMockValueMutation(newMockStateValue);

      await mutator.apply(mutation);
      await mutator.undo();

      const expectedActions = [
        `apply(10):5`,
        `undo:5`,
        `redo:5`,
        `apply(10):5`,
      ];

      // Test
      await mutator.redo();

      // Assert
      expect(mutator.mockState.value).toBe(newMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Redoing a continuous mutation re-applies it as it was after its last update", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      // const newMockStateValue = 10;
      const mutation = new SetMockValueContinuousMutation();

      // Fully apply continuous mutation, updating several times
      await mutator.beginContinuous(mutation);
      const finalUpdateValue = 30;
      for (let i = 10; i <= finalUpdateValue; i += 10) {
        await mutator.updateContinuous(mutation, { value: i });
      }
      await mutator.apply(mutation);
      expect(mutation.hasBeenApplied).toBe(true);
      await mutator.undo();
      expect(mutation.hasBeenApplied).toBe(false);

      const expectedActions = [
        `begin:5`,
        `update(10):5`,
        `update(20):10`,
        `update(30):20`,
        `apply:30`,
        `undo:5`,
        `redo:5`,
        `begin:5`,
        `update(30):5`,
        `apply:30`,
      ];

      // Test
      await mutator.redo();

      // Assert
      expect(mutator.mockState.value).toBe(finalUpdateValue);
      expect(actions).toEqual(expectedActions);
      expect(mutation.hasBeenApplied).toBe(true);
    });

    test("Calling redo twice redoes two mutations", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      // Apply two mutations
      const finalUpdateValue = 20;
      const newMockStateValues = [10, finalUpdateValue];
      for (const newMockStateValue of newMockStateValues) {
        const mutation = new SetMockValueMutation(newMockStateValue);
        await mutator.apply(mutation);
      }
      // Undo two mutations
      await mutator.undo();
      await mutator.undo();

      const expectedActions = [
        `apply(10):5`,
        `apply(20):10`,
        `undo:10`,
        `undo:5`,
        `redo:5`,
        `apply(10):5`,
        `redo:10`,
        `apply(20):10`,
      ];

      // Test
      // Redo two mutations
      await mutator.redo();
      await mutator.redo();

      // Assert
      expect(mutator.mockState.value).toBe(finalUpdateValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Calling redo while a continuous mutation is debouncing applies it and then redoes (not supposed to be possible)", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);
      // @NOTE prevent redo stack from being cleared
      // This is a hack that puts the mutator into an impossible state
      mutator.doNotClearRedoStack = true;

      // Apply and undo a mutation
      const firstMutationNewValue = 10;
      const firstMutation = new SetMockValueMutation(firstMutationNewValue);
      await mutator.apply(firstMutation);
      await mutator.undo();

      // Begin a new (debounced) mutation
      // @NOTE in the real world, this would CLEAR the redo stack
      // but for this test, we have disabled this behaviour
      const newMockStateValue = 20;
      const mockDebounceMutationTarget = {};
      const mockDebounceWindowMs = 100;
      await mutator.debounceContinuous(
        SetMockValueContinuousMutation,
        mockDebounceMutationTarget,
        () => new SetMockValueContinuousMutation(),
        () => ({ value: newMockStateValue }),
        mockDebounceWindowMs,
      );

      // @NOTE do not wait for debounce to elapse

      const expectedActions = [
        `apply(10):5`,    // Apply first mutation
        `undo:5`,         // Undo first mutation
        `begin:5`,        // Begin new (debounced) mutation
        `update(20):5`,
        `redo:20`,        // Call redo while debouncing
        `apply:20`,       // Debounced mutation is applied
        `apply(10):20`,   // "undone" first mutation is re-applied
      ];

      // Test
      await mutator.redo();

      // Assert
      expect(mutator.mockState.value).toBe(firstMutationNewValue);
      expect(actions).toEqual(expectedActions);
    });

    test("Redoing an empty undo stack safely does nothing", async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      const expectedActions: string[] = [
      ];

      // Test
      await mutator.redo();

      // Assert
      expect(mutator.mockState.value).toBe(initialMockStateValue);
      expect(actions).toEqual(expectedActions);
    });

    test('`persistChanges` and `afterPersistChanges` are called after redo is called', async () => {
      // Setup
      const initialMockStateValue = 5;
      const { mutator, actions } = createMockMutator(initialMockStateValue);

      mutator.persistChangesImplementation = (): Promise<void> => {
        actions.push('persistChanges');
        return Promise.resolve();
      };

      // Create a mutation
      const newValue = 10;
      const mutation = new SetMockValueMutation(newValue);
      mutation.afterPersistChanges = () => {
        actions.push('afterPersistChanges');
        return Promise.resolve();
      };

      // Apply and undo mutation
      await mutator.apply(mutation);
      await mutator.undo();

      const expectedActions: string[] = [
        'apply(10):5',          // apply:$current_value
        'persistChanges',
        'afterPersistChanges',
        'persistChanges',       // @NOTE from undo()
        'afterPersistChanges',
        `undo:5`,
        `redo:5`,
        `apply(10):5`,
        'persistChanges',       // @NOTE from redo()
        'afterPersistChanges',
      ];

      // Test
      await mutator.redo();

      // Assert
      expect(mutator.mockState.value).toBe(newValue);
      expect(actions).toEqual(expectedActions);
    });
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
  public onRedo: ((args: MockMutationDependencies, mutation: IMutation2<MockMutationDependencies, unknown>) => void) | undefined;

  public persistChangesImplementation: (() => Promise<void>) | undefined;

  public doNotClearRedoStack: boolean = false;

  public constructor(mockStateInitialValue: number = 0) {
    super(new MutationController());
    this.mockState = {
      value: mockStateInitialValue,
    };
  }

  protected override __beginContinuousImmediate<TMutationArgs>(continuousMutation: IContinuousMutation2<MockMutationDependencies, TMutationArgs>, clearRedoStack?: boolean): Promise<void> {
    this.onBegin?.(this.getMutationDependencies(), continuousMutation);
    return super.__beginContinuousImmediate(continuousMutation, clearRedoStack);
  }

  protected override __updateContinuousImmediate<TMutationArgs>(continuousMutation: IContinuousMutation2<MockMutationDependencies, TMutationArgs>, updateArgs: TMutationArgs): Promise<void> {
    this.onUpdate?.(this.getMutationDependencies(), continuousMutation, updateArgs);
    return super.__updateContinuousImmediate(continuousMutation, updateArgs);
  }

  protected override __applyImmediate<TMutationArgs>(mutation: IMutation2<MockMutationDependencies, TMutationArgs>, clearRedoStack?: boolean): Promise<void> {
    this.onApply?.(this.getMutationDependencies(), mutation);
    return super.__applyImmediate(mutation, clearRedoStack);
  }

  protected override async __undoImmediate(): Promise<void> {
    const mutation = this.latestMutation;
    if (mutation === undefined) return;
    await super.__undoImmediate();

    // @NOTE Special case: Undo is fired AFTER the mutation, so the updated value can be read
    this.onUndo?.(this.getMutationDependencies(), mutation.instance);
  }

  protected override async __redoImmediate(): Promise<void> {
    const mutation = this.latestUndoneMutation;
    if (mutation === undefined) return;
    this.onRedo?.(this.getMutationDependencies(), mutation.instance);
    return super.__redoImmediate();
  }

  public override clearRedoStack(): void {
    if (!this.doNotClearRedoStack) {
      super.clearRedoStack();
    }
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
    mutator.onRedo = (args, mutation) => this.onMutatorRedo(args, mutation);
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

  private onMutatorRedo({ MockState }: MockMutationDependencies, mutation: IMutation2<MockMutationDependencies, unknown>): void {
    if (mutation instanceof SetMockValueMutation || mutation instanceof SetMockValueContinuousMutation) {
      this.actions.push(`redo:${MockState.value}`);
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
