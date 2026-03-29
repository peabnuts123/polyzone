import { IMutation, IMutation2 } from "./IMutation";

// @TODO Remove, replace with new
export interface IContinuousMutation<TMutationArgs, TUpdateArgs> extends IMutation<TMutationArgs> {
  get hasBeenApplied(): boolean;
  set hasBeenApplied(value: boolean);

  begin(args: TMutationArgs): void | Promise<void>;
  update(args: TMutationArgs, updateArgs: TUpdateArgs): void | Promise<void>;
}

export interface IContinuousMutation2<TMutationDependencies, TMutationArgs> extends IMutation2<TMutationDependencies, TMutationArgs> {
  /**
   * Whether this continuous mutation has been fully applied.
   * This will be false if only `update()` has been called by not `apply()`.
   */
  hasBeenApplied: boolean;
  /** Mutation args used to redo a continuous mutation. */
  get redoArgs(): TMutationArgs | undefined;
  /** Instruct the continuous mutation to take a snapshot of its state for use with redo. */
  captureRedoArgs(dependencies: TMutationDependencies, args: TMutationArgs): void;
  updateMutation(dependencies: TMutationDependencies, mutationArgs: TMutationArgs): void | Promise<void>;
}

export abstract class BaseContinuousMutation<TMutationDependencies, TMutationArgs> implements IContinuousMutation2<TMutationDependencies, TMutationArgs> {
  public abstract get description(): string;
  public hasBeenApplied: boolean = false;
  private _redoArgs: TMutationArgs | undefined;
  private undoArgs: TMutationArgs | undefined;

  /**
   * If set to `true`, `customUndo()` will be called instead of the default undo logic.
   * NOTE: You must override `customUndo()` if you enable this.
   */
  protected useCustomUndo: boolean = false;
  /**
   * If set to `true`, the user will be prompted for confirmation before undoing the mutation.
   */
  public promptForUndo: boolean = false;

  // @NOTE Only exists for naming consistency
  public updateMutation(dependencies: TMutationDependencies, mutationArgs: TMutationArgs): void | Promise<void> {
    return this.update(dependencies, mutationArgs);
  }
  // @TODO Consdier making these just async
  protected abstract update(dependencies: TMutationDependencies, mutationArgs: TMutationArgs): void | Promise<void>;

  // @NOTE Only exists for naming consistency
  public applyMutation(dependencies: TMutationDependencies): void | Promise<void> {
    return this.apply(dependencies);
  }
  public abstract apply(dependencies: TMutationDependencies): void | Promise<void>;

  public async undoMutation(dependencies: TMutationDependencies): Promise<void> {
    if (this.useCustomUndo) {
      // Custom undo handling implemented
      await this.customUndo(dependencies);
    } else {
      if (this.undoArgs === undefined) throw new Error(`Cannot undo mutation - no undo state has been captured. Has the mutation been applied?`);

      // Apply "reverse" mutation
      await this.update(dependencies, this.undoArgs);
      await this.apply(dependencies);

      // Clear undo state
      // Really unsure as to whether we should clear this or not
      this.undoArgs = undefined;
    }
  }

  public captureRedoArgs(dependencies: TMutationDependencies, args: TMutationArgs): void {
    this._redoArgs = this.getRedoArgs(dependencies, args);
  }
  protected getRedoArgs(dependencies: TMutationDependencies, args: TMutationArgs): TMutationArgs {
    // @NOTE By default just capture the update args
    // Implementations may wish to override this behaviour
    return args;
  }

  public captureUndoArgs(dependencies: TMutationDependencies): void {
    this.undoArgs = this.getUndoArgs(dependencies);
  }
  protected abstract getUndoArgs(dependencies: TMutationDependencies): TMutationArgs;

  /**
   * Override this method if you want to provide custom undo logic for a mutation.
   * If `useCustomUndo` is set to `true`, this will be called instead of `getUndoArgs()`/`undoMutation()`.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected customUndo(dependencies: TMutationDependencies): Promise<void> {
    throw new Error(`Not implemented`);
  }

  public afterPersistChanges(_dependencies: TMutationDependencies): void | Promise<void> {
    /* No-op */
  };

  public get redoArgs(): TMutationArgs | undefined {
    return this._redoArgs;
  }
}

// @TODO Remove, replace with New
export function isContinuousMutation<TMutationArgs>(mutation: IMutation<TMutationArgs> | undefined): mutation is IContinuousMutation<TMutationArgs, unknown> {
  return mutation !== undefined && 'begin' in mutation && 'update' in mutation && 'hasBeenApplied' in mutation;
}
export function isContinuousMutation2<TMutationDependencies, TMutationArgs>(mutation: IMutation2<TMutationDependencies, TMutationArgs> | undefined): mutation is IContinuousMutation2<TMutationDependencies, TMutationArgs> {
  return mutation instanceof BaseContinuousMutation;
}
