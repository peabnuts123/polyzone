import { IMutation, IMutation2 } from "./IMutation";

// @TODO Remove, replace with new
export interface IContinuousMutation<TMutationArgs, TUpdateArgs> extends IMutation<TMutationArgs> {
  get hasBeenApplied(): boolean;
  set hasBeenApplied(value: boolean);

  begin(args: TMutationArgs): void | Promise<void>;
  update(args: TMutationArgs, updateArgs: TUpdateArgs): void | Promise<void>;
}

export interface IContinuousMutation2<TMutationDependencies, TMutationArgs> extends IMutation2<TMutationDependencies, TMutationArgs> {
  hasBeenApplied: boolean;
  updateMutation(dependencies: TMutationDependencies, mutationArgs: TMutationArgs): void | Promise<void>;
}

export abstract class BaseContinuousMutation<TMutationDependencies, TMutationArgs> implements IContinuousMutation2<TMutationDependencies, TMutationArgs> {
  public abstract get description(): string;
  public hasBeenApplied: boolean = false;
  private undoArgs: TMutationArgs | undefined;

  // @NOTE Only exists for naming consistency
  public updateMutation(dependencies: TMutationDependencies, mutationArgs: TMutationArgs): void | Promise<void> {
    return this.update(dependencies, mutationArgs);
  }
  protected abstract update(dependencies: TMutationDependencies, mutationArgs: TMutationArgs): void | Promise<void>;

  // @NOTE Only exists for naming consistency
  public applyMutation(dependencies: TMutationDependencies): void | Promise<void> {
    return this.apply(dependencies);
  }
  public abstract apply(dependencies: TMutationDependencies): void | Promise<void>;

  public async undoMutation(dependencies: TMutationDependencies): Promise<void> {
    if (this.undoArgs === undefined) throw new Error(`Cannot undo mutation - no undo state has been captured. Has the mutation been applied?`);

    // Apply "reverse" mutation
    await this.update(dependencies, this.undoArgs);
    await this.apply(dependencies);

    // Clear undo state
    // Really unsure as to whether we should clear this or not
    this.undoArgs = undefined;
  }

  public captureUndoArgs(dependencies: TMutationDependencies): void {
    this.undoArgs = this.getUndoArgs(dependencies);
  }
  protected abstract getUndoArgs(dependencies: TMutationDependencies): TMutationArgs;

  public afterPersistChanges(_dependencies: TMutationDependencies): void | Promise<void> {
    /* No-op */
  };

}

// @TODO Remove, replace with New
export function isContinuousMutation<TMutationArgs>(mutation: IMutation<TMutationArgs> | undefined): mutation is IContinuousMutation<TMutationArgs, unknown> {
  return mutation !== undefined && 'begin' in mutation && 'update' in mutation && 'hasBeenApplied' in mutation;
}
export function isContinuousMutation2<TMutationDependencies, TMutationArgs>(mutation: IMutation2<TMutationDependencies, TMutationArgs> | undefined): mutation is IContinuousMutation2<TMutationDependencies, TMutationArgs> {
  return mutation instanceof BaseContinuousMutation;
}
