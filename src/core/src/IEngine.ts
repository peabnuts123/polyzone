// @TODO Rename runtime, actually, or Game or something
export interface IEngine {
  /** @internal */
  consumeFrameBudget(budget: number): void;
}
