import { Input } from "../input/Input";
import { Scene } from "../scene/Scene";
import { GameObject } from "./GameObject";

export interface CustomScriptArgs {
  id: string;
  gameObject: GameObject;
  scene: Scene;
  input: Input;
}

export abstract class CustomScript {
  public readonly id: string;
  public readonly gameObject: GameObject;
  public readonly scene: Scene;
  protected readonly input: Input;

  /**
   * @internal
   * @NOTE Marked as internal since constructor is called before scene is initialised
   * which leads to spooky action.
   */
  public constructor({ id, gameObject, scene, input }: CustomScriptArgs) {
    this.id = id;
    this.gameObject = gameObject;
    this.scene = scene;
    this.input = input;
  }

  public init(): void { }
  public onUpdate(deltaTime: number, time: number): void { void deltaTime; }
  public onDestroy(): void { }
}
