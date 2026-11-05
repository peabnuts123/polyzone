import { Input } from "../input/Input";
import { Scene } from "../scene/Scene";
import { GameObject } from "./GameObject";

export interface CustomScriptArgs {
  id: string;
  gameObject: GameObject;
  input: Input;
}

export abstract class CustomScript {
  public readonly id: string;
  public readonly gameObject: GameObject;
  protected readonly input: Input;

  /**
   * @internal
   * @NOTE Marked as internal since constructor is called before scene is initialised
   * which leads to spooky action.
   */
  public constructor({ id, gameObject, input }: CustomScriptArgs) {
    this.id = id;
    this.gameObject = gameObject;
    this.input = input;
  }

  public init(): void { }
  public onUpdate(deltaTime: number, time: number): void {
    // @NOTE Suppressing linter / tsc
    void deltaTime;
    void time;
  }
  public onDestroy(): void { }

  protected scene(): Scene { return this.gameObject.scene; }
}
