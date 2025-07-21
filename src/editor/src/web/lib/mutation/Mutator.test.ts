import { describe, expect, test } from "vitest";
import { Mutator } from './Mutator';
import { IMutation } from "./IMutation";
import { IContinuousMutation } from "./IContinuousMutation";

describe(Mutator.name, () => {
  /* @TODO Test Backlog
    - Beginning another continuous mutation while the previous mutation is still debouncing applies the previous mutation immediately
    - Beginning another regular mutation while the previous mutation is still debouncing applies the previous mutation immediately
    - Beginning another continuous mutation before the previous continuous mutation has been applied throws an error
    - Updating a continuous mutation that is not the latest mutation throws an error
    - Calling `apply()` on a continuous mutation that is not the latest mutation throws an error
    - Calling `applyInstantly()` on a continuous mutation applies the mutation instantly
    - Calling `apply()` on a regular mutation before the previous continuous mutation has been applied throws an error
    - Calling `apply()` on a regular mutation twice throws an error
    - Calling `apply()` on a continuous mutation twice throws an error
    - Mutation with `afterPersistChanges()` is called after `persistChanges()` is called
    - Calling `debounceContinuous()` with another continuous mutation while the previous mutation is still debouncing applies the previous mutation immediately
   */

  test('Applying a mutation applies it', () => {
    // Setup
    const initialMockStateValue = 5;
    const mutator = new MockMutator(initialMockStateValue);
    const newMockStateValue = 9;

    // Test
    mutator.apply(new SetMockValueMutation(newMockStateValue));

    // Assert
    expect(mutator.mockState.value).toBe(newMockStateValue);
  });

  test('Applying several mutations applies them in series', () => {
    // Setup
    const initialMockStateValue = 5;
    const mutator = new MockMutator(initialMockStateValue);
    // const mockValueA = 9;
    const updateValues: number[] = [9, 12, 15];
    const finalUpdateValue = updateValues[updateValues.length - 1];
    // const mockValueB = 12;

    const actions: string[] = [];
    const expectedActions: string[] = [
      // @TODO Ordering will change when mutations are async
      'queue(9):5',       // queue($new_value):$current_value
      'apply(9):5',       // apply($new_value):$current_value
      'queue(12):9',
      'apply(12):9',
      'queue(15):12',
      'apply(15):12',
    ];

    // Test
    for (const updateValue of updateValues) {
      actions.push(`queue(${updateValue}):${mutator.mockState.value}`);
      mutator.apply(
        new SetMockValueMutation(updateValue,
          /* onApply: */({ MockState }) => {
            actions.push(`apply(${updateValue}):${MockState.value}`);
          }),
      );
      // @TODO this will be async in the future
      expect(mutator.mockState.value).toBe(updateValue);
    }

    // Assert
    expect(actions).toEqual(expectedActions);
    expect(mutator.mockState.value).toBe(finalUpdateValue);
  });

  test('Continuous mutation mutates state, only persists on apply', () => {
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
    mutator.beginContinuous(continuousMutation);

    /* Continuous phase: update... */
    for (const updateValue of updateValues) {
      mutator.updateContinuous(continuousMutation, { value: updateValue });
      expect(mutator.mockState.value).toBe(updateValue); // State should be updated immediately
    }
    expect(timesPersisted).toBe(0); // No persistence yet

    /* Continuous phase: apply */
    mutator.apply(continuousMutation);

    // Assert
    expect(actions).toEqual(expectedActions);
    expect(mutator.mockState.value).toBe(finalUpdateValue);
    expect(timesPersisted).toBe(1);
  });

  test('Calling `debounceContinuous()` repeatedly updates the state, only applies after debounce window', () => {
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
      // @TODO The order of this will change when mutations are async
      'queue(9):5',       // queue($new_value):$current_value
      'begin:5',          // begin:$current_value
      'update(9):5',      // update($new_value):$current_value
      'queue(12):9',
      'update(12):9',
      'queue(15):12',
      'update(15):12',
      'queue(20):15',
      'update(20):15',
      'apply:20',         // apply:$current_value
    ];

    // Test
    for (const updateValue of updateValues) {
      actions.push(`queue(${updateValue}):${mutator.mockState.value}`);
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
      );
    }

    // Apply should not have been called yet
    expect(actions.some((action) => action.startsWith('apply'))).toBe(false);
    expect(timesPersisted).toBe(0);

    // Assert
    // Wait for debounce timeout before asserting
    // Need to wrap in a Promise so that vitest knows it needs to wait
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(actions).toEqual(expectedActions);
        expect(mutator.mockState.value).toBe(finalUpdateValue); // @TODO Not sure if this will be true when async, unless we `await`
        expect(timesPersisted).toBe(1);

        resolve();
      }, mockDebounceWindowMs + 50);
    });
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
