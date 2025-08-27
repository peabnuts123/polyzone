import { ActiveMutation, BaseMutatorNew } from "./MutatorNew";

interface RegisteredMutator {
  instance: BaseMutatorNew;
  isActive: boolean;
}

export class MutationController {
  private latestMutationId: number = 1000;
  private mutators: RegisteredMutator[] = [];

  public async undoLatestActive(): Promise<void> {
    let latestMutation: ActiveMutation | undefined = undefined;
    let latestMutationMutator: BaseMutatorNew | undefined = undefined;
    for (const mutator of this.activeMutators) {
      if (latestMutation === undefined) {
        // `latestMutation` is empty - just assign initial value
        latestMutation = mutator.latestMutation;
        latestMutationMutator = mutator;
      } else if (
        mutator.latestMutation !== undefined &&
        mutator.latestMutation.id > latestMutation.id
      ) {
        // `mutator`'s latest mutation exists with an ID greater than our latest known value
        latestMutation = mutator.latestMutation;
        latestMutationMutator = mutator;
      }
      // Else mutation is not latest
    }

    // Call undo on the active mutator with the most recent mutation
    if (latestMutation !== undefined && latestMutationMutator !== undefined) {
      await latestMutationMutator.undo();
    }
  }

  public requestMutationId(): number {
    return this.latestMutationId++;
  }

  public setMutatorActive(mutator: BaseMutatorNew, isActive: boolean): void {
    const registeredMutator = this.mutators.find((m) => m.instance === mutator);
    if (registeredMutator === undefined) {
      throw new Error("Mutator not registered");
    }
    registeredMutator.isActive = isActive;
  }

  public registerMutator(mutator: BaseMutatorNew): void {
    if (this.mutators.some((m) => m.instance === mutator)) {
      throw new Error("Mutator is already registered");
    }
    this.mutators.push({
      instance: mutator,
      isActive: false,
    });
  }

  public deregisterMutator(mutator: BaseMutatorNew): void {
    this.mutators = this.mutators.filter((registeredMutator) => registeredMutator.instance !== mutator);
  }

  private get activeMutators(): BaseMutatorNew[] {
    return this.mutators
      .filter((mutator) => mutator.isActive)
      .map((mutator) => mutator.instance);
  }
}
