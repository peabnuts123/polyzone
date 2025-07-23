export interface IMutation<TMutationArgs> {
  get description(): string;
  apply(args: TMutationArgs): void | Promise<void>;
  undo(args: TMutationArgs): void | Promise<void>;
  afterPersistChanges?: (args: TMutationArgs) => void | Promise<void>;
}
