import { Context } from "../Context";
import { IEngine } from "../IEngine";

export class MockEngine implements IEngine {
  private readonly id: string;

  private _budget: number = 0;

  private constructor() {
    this.id = (~~(Math.random() * 0x10_0000)).toString(16);
  }

  public consumeFrameBudget(budget: number): void {
    this._budget += budget;
  }

  // private register(): void {
  //   console.log(`[DEBUG] (${this.id}) Registering mock engine`);
  //   Vector3.engine = this;
  // }

  // public deregister(): void {
  //   console.log(`[DEBUG] (${this.id}) Deregistering mock engine`);
  //   Vector3.engine = undefined;
  // }

  // public static inScope(callback: (engine: MockEngine) => void): void {
  //   const mockEngine = new MockEngine();
  //   try {
  //     mockEngine.register();
  //     callback(mockEngine);
  //   } finally {
  //     mockEngine.deregister();
  //   }
  // }

  public static register(): MockEngine {
    const mockEngine = new MockEngine();
    Context.bindEngine(mockEngine);
    return mockEngine;
  }

  public get budget(): number { return this._budget; }
}
