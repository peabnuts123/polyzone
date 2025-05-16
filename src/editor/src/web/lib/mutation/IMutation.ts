export interface IMutation<TMutationArgs> {
  get description(): string;
  apply(args: TMutationArgs): void;
  undo(args: TMutationArgs): void;
  afterPersistChanges?: (args: TMutationArgs) => Promise<void> | void;
}
