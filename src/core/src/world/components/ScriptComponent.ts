import { GameObject } from "../GameObject";
import { GameObjectComponent } from "../GameObjectComponent";

export abstract class ScriptComponent extends GameObjectComponent {
  public readonly id: string;
  public readonly gameObject: GameObject;

  public constructor(id: string, gameObject: GameObject) {
    super();
    this.id = id;
    this.gameObject = gameObject;
  }
}
