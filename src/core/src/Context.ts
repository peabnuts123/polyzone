import { IEngine } from "./IEngine";

/** @internal */
export abstract class Context {
  private static _engine: IEngine | undefined;

  public static bindEngine(engine: IEngine): void {
    if (Context.engine !== undefined) {
      throw new Error(`Cannot bind engine - an engine instance is already bound`);
    } else {
      Context.engine = engine;
    }
  }
  public static clear(): void {
    Context.engine = undefined;
  }

  public static get engine(): IEngine | undefined { return Context._engine; }
  private static set engine(value: IEngine | undefined) { Context._engine = value; }
}
