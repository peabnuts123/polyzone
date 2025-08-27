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
  promptForUndo: boolean;
  applyMutation(dependencies: TMutationDependencies): void | Promise<void>;
  undoMutation(dependencies: TMutationDependencies): void | Promise<void>;
  captureUndoArgs(dependencies: TMutationDependencies): void;
  afterPersistChanges?: (dependencies: TMutationDependencies) => void | Promise<void>;
}

export abstract class BaseMutation<TMutationDependencies, TMutationArgs> implements IMutation2<TMutationDependencies, TMutationArgs> {
  public abstract get description(): string;
  private args: TMutationArgs;
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


  public constructor(args: TMutationArgs) {
    this.args = args;
  }

  // @TODO Just return `Promise<void>` ?
  public applyMutation(dependencies: TMutationDependencies): void | Promise<void> {
    return this.apply(dependencies, this.args);
  }
  protected abstract apply(dependencies: TMutationDependencies, args: TMutationArgs): void | Promise<void>;

  public async undoMutation(dependencies: TMutationDependencies): Promise<void> {
    if (this.useCustomUndo) {
      // Custom undo handling implemented
      await this.customUndo(dependencies, this.args);
    } else {
      if (this.undoArgs === undefined) throw new Error(`Cannot undo mutation - no undo state has been captured. Has the mutation been applied?`);

      // Apply "reverse" mutation
      await this.apply(dependencies, this.undoArgs);

      // Clear undo state
      // Really unsure as to whether we should clear this or not
      this.undoArgs = undefined;
    }
  }

  public captureUndoArgs(dependencies: TMutationDependencies): void {
    if (!this.useCustomUndo) {
      this.undoArgs = this.getUndoArgs(dependencies);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getUndoArgs(dependencies: TMutationDependencies): TMutationArgs {
    throw new Error(`Not implemented`);
  }

  /**
   * Override this method if you want to provide custom undo logic for a mutation.
   * If `useCustomUndo` is set to `true`, this will be called instead of `getUndoArgs()`/`undoMutation()`.
   * NOTE: This function is passed the regular args (returned from the constructor), NOT "undo" args (returned from `getUndoArgs()`)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected customUndo(dependencies: TMutationDependencies, args: TMutationArgs): Promise<void> {
    throw new Error(`Not implemented`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public afterPersistChanges(dependencies: TMutationDependencies): void | Promise<void> {
    /* No-op */
  };
}
