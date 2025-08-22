// @TODO Remove, replace with new
export interface IMutation<TMutationArgs> {
  get description(): string;
  apply(args: TMutationArgs): void | Promise<void>;
  undo(args: TMutationArgs): void | Promise<void>;
  afterPersistChanges?: (args: TMutationArgs) => void | Promise<void>;
}

// @TODO Rename
export interface IMutation2<TMutationDependencies, TMutationArgs> {
  get description(): string;
  applyMutation(dependencies: TMutationDependencies): void | Promise<void>;
  undoMutation(dependencies: TMutationDependencies): void | Promise<void>;
  captureUndoArgs(dependencies: TMutationDependencies): void;
  afterPersistChanges?: (dependencies: TMutationDependencies) => void | Promise<void>;
}

export abstract class BaseMutation<TMutationDependencies, TMutationArgs> implements IMutation2<TMutationDependencies, TMutationArgs> {
  public abstract get description(): string;
  private args: TMutationArgs;
  private undoArgs: TMutationArgs | undefined;

  public constructor(args: TMutationArgs) {
    this.args = args;
  }

  // @TODO Just return `Promise<void>` ?
  public applyMutation(dependencies: TMutationDependencies): void | Promise<void> {
    return this.apply(dependencies, this.args);
  }
  protected abstract apply(dependencies: TMutationDependencies, args: TMutationArgs): void | Promise<void>;

  public async undoMutation(dependencies: TMutationDependencies): Promise<void> {
    if (this.undoArgs === undefined) throw new Error(`Cannot undo mutation - no undo state has been captured. Has the mutation been applied?`);

    // Apply "reverse" mutation
    await this.apply(dependencies, this.undoArgs);

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
