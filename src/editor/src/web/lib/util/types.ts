/**
 * Type utility for more clearly writing function types without bracket overload.
 * Works very similar to C#'s `Func<>` type, if you are familiar with that.
 * @usage
 * ```typescript
 * () => void                === Func<void>
 * (arg: number) => void     === Func<number, void>
 * () => number              === Func<number>
 * (arg: number) => string   === Func<number, string>
 * ```
 */
export type Func<T1OrReturnType, TReturnType = never> = [TReturnType] extends [never] ? (
  () => T1OrReturnType
) : (
  (arg: T1OrReturnType) => TReturnType
);
