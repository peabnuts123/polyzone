import { describe, test, expect } from 'vitest';
import { MutationController, RegisteredMutator } from './MutationController';
import { BaseMutatorNew, MutatorNew } from './MutatorNew';
import { BaseMutation } from './IMutation';

describe(MutationController.name, () => {
  test("Registering/deregistering a mutator adds/removes it from the set of all mutators", () => {
    // Setup
    const mutationController = new MockMutationController();
    const initialMutators = [...mutationController.getRegisteredMutators()];
    const initialActiveMutators = [...mutationController.getActiveMutators()];

    // Test
    // Register
    // @NOTE Mutator constructor calls register()
    const mockMutator = new MockMutator(mutationController);
    const updatedMutators = [...mutationController.getRegisteredMutators()];
    const updatedActiveMutators = [...mutationController.getActiveMutators()];

    // Deregister
    mutationController.deregisterMutator(mockMutator);
    const finalMutators = [...mutationController.getRegisteredMutators()];
    const finalActiveMutators = [...mutationController.getActiveMutators()];

    // Assert
    expect(initialMutators).toHaveLength(0);
    expect(initialActiveMutators).toHaveLength(0);
    expect(updatedMutators).toHaveLength(1);
    expect(updatedActiveMutators).toHaveLength(0);
    expect(updatedMutators[0].instance).toBe(mockMutator);
    expect(finalMutators).toHaveLength(0);
    expect(finalActiveMutators).toHaveLength(0);
  });

  test("`setMutatorActive()` adds/removes a registered mutator from the set of all active mutators", () => {
    // Setup
    const mutationController = new MockMutationController();
    const mockMutator = new MockMutator(mutationController);

    const initialActiveMutators = [...mutationController.getActiveMutators()];

    // Test
    // Enable
    mutationController.setMutatorActive(mockMutator, true);
    const updatedActiveMutators = [...mutationController.getActiveMutators()];

    // Disable
    mutationController.setMutatorActive(mockMutator, false);
    const finalActiveMutators = [...mutationController.getActiveMutators()];

    // Assert
    expect(initialActiveMutators).toHaveLength(0);
    expect(updatedActiveMutators).toHaveLength(1);
    expect(updatedActiveMutators).toContain(mockMutator);
    expect(finalActiveMutators).toHaveLength(0);
  });

  test("Successive calls to `requestMutationId()` gives a unique ID every time", () => {
    // Setup
    const mutationController = new MockMutationController();


    // Test
    const mutationIds: number[] = [];
    for (let i = 0; i < 10; i++) {
      const mutationId = mutationController.requestMutationId();

      // Assert
      expect(mutationIds).not.toContain(mutationId);
      mutationIds.push(mutationId);
    }
  });

  test("`undoLatestActive()` undoes the latest mutation of all ACTIVE mutators", async () => {
    // Setup
    const mutationController = new MockMutationController();
    const mockMutatorA = new MockMutator(mutationController);
    const mockMutatorB = new MockMutator(mutationController);

    const preMutationStateA = mockMutatorA.state.value;
    const preMutationStateB = mockMutatorB.state.value;

    // Apply mutations to A, then B
    const newValueA = 10;
    const newValueB = 20;
    const mutationA = new MockMutation({ value: newValueA });
    const mutationB = new MockMutation({ value: newValueB });

    await mockMutatorA.apply(mutationA);
    await mockMutatorB.apply(mutationB);

    const initialStateA = mockMutatorA.state.value;
    const initialStateB = mockMutatorB.state.value;

    // Only activate mutator A
    mutationController.setMutatorActive(mockMutatorA, true);

    // Test
    // Call `undo()`
    // Even though mutation B was the most recent, only Mutator A is active,
    // so mutation A is the "latest active" to get undone
    await mutationController.undoLatestActive();

    const updatedStateA = mockMutatorA.state.value;
    const updatedStateB = mockMutatorB.state.value;

    // Assert
    expect(initialStateA).not.toBe(preMutationStateA);
    expect(initialStateA).toBe(newValueA);
    expect(initialStateB).not.toBe(preMutationStateB);
    expect(initialStateB).toBe(newValueB);

    // A should be undone
    expect(updatedStateA).toBe(preMutationStateA);
    expect(updatedStateA).not.toBe(newValueA);
    // B should not be undone
    expect(updatedStateB).not.toBe(preMutationStateB);
    expect(updatedStateB).toBe(newValueB);
  });

  test("`redoLatestActive()` redoes the most recent undone mutation of all ACTIVE mutators", async () => {
    // Setup
    const mutationController = new MockMutationController();
    const mockMutatorA = new MockMutator(mutationController);
    const mockMutatorB = new MockMutator(mutationController);

    const preMutationStateA = mockMutatorA.state.value;
    const preMutationStateB = mockMutatorB.state.value;

    // Apply mutations to A, then B
    const newValueA = 10;
    const newValueB = 20;
    const mutationA = new MockMutation({ value: newValueA });
    const mutationB = new MockMutation({ value: newValueB });

    await mockMutatorA.apply(mutationA);
    await mockMutatorB.apply(mutationB);

    // Undo both mutations in reverse order - as if user was pressing Ctrl+Z
    await mockMutatorB.undo();
    await mockMutatorA.undo();

    const undoneStateA = mockMutatorA.state.value;
    const undoneStateB = mockMutatorB.state.value;

    // Only activate mutator B
    mutationController.setMutatorActive(mockMutatorB, true);

    // Test
    // Call `redo()`
    // Even though mutation A was the most recent undone, only Mutator B is active,
    // so mutation B is the "latest active" to get redone
    await mutationController.redoLatestActive();

    const updatedStateA = mockMutatorA.state.value;
    const updatedStateB = mockMutatorB.state.value;

    // Assert
    // After mutations undone state should be initial values
    expect(undoneStateA).toBe(preMutationStateA);
    expect(undoneStateA).not.toBe(newValueA);
    expect(undoneStateB).toBe(preMutationStateB);
    expect(undoneStateB).not.toBe(newValueB);

    // After redo() state A should be unmodified, state B should be mutated
    expect(updatedStateA).toBe(preMutationStateA);
    expect(updatedStateA).not.toBe(newValueA);
    expect(updatedStateB).not.toBe(preMutationStateB);
    expect(updatedStateB).toBe(newValueB);
  });
});

class MockMutationController extends MutationController {
  // @NOTE Type laundering hacks to expose private property
  public getRegisteredMutators(): RegisteredMutator[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (this as any).mutators as RegisteredMutator[];
  }

  // @NOTE Type laundering hacks to expose private property
  public getActiveMutators(): BaseMutatorNew[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (this as any).activeMutators as BaseMutatorNew[];
  }
}

interface MockState {
  value: number;
}
interface MockMutatorDependencies {
  MockState: MockState;
}
class MockMutator extends MutatorNew<MockMutatorDependencies> {
  public readonly state: MockState;

  public constructor(mutationController: MutationController) {
    super(mutationController);
    this.state = {
      value: 5,
    };
  }

  protected override getMutationDependencies(): MockMutatorDependencies {
    return {
      MockState: this.state,
    };
  }

  protected override persistChanges(): Promise<void> {
    /* @NOTE No-op */
    return Promise.resolve();
  }
}

interface MockMutationArgs {
  value: number;
}
class MockMutation extends BaseMutation<MockMutatorDependencies, MockMutationArgs> {
  protected override apply({ MockState }: MockMutatorDependencies, { value }: MockMutationArgs): void | Promise<void> {
    MockState.value = value;
  }

  protected override getUndoArgs({ MockState }: MockMutatorDependencies): MockMutationArgs {
    return {
      value: MockState.value,
    };
  }

  public override get description(): string {
    return "Set mock value";
  }
}
