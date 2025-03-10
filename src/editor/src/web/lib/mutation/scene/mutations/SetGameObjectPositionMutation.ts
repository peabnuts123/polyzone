import { Vector3Definition as Vector3Archive } from "@polyzone/runtime/src/cartridge/archive/util";
import { Vector3 } from "@polyzone/core/src/util";

import { GameObjectData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectPositionMutationUpdateArgs {
  position: Vector3;
  resetGizmo?: boolean;
}

export class SetGameObjectPositionMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectPositionMutationUpdateArgs> {
  // State
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectData;
  private position: Vector3;
  private _hasBeenApplied: boolean = false;

  // Undo state
  private configPosition: Vector3 | undefined = undefined;
  private scenePosition: Vector3 | undefined = undefined;


  public constructor(gameObject: GameObjectData) {
    this.gameObject = gameObject;
    this.position = gameObject.transform.position;
  }

  public begin(_args: SceneViewMutationArguments): void {
    // - Store undo values
    this.configPosition = this.gameObject.transform.position;
    this.scenePosition = this.gameObject.sceneInstance!.transform.position;
  }

  public update({ SceneViewController }: SceneViewMutationArguments, { position, resetGizmo }: SetGameObjectPositionMutationUpdateArgs): void {
    this.position = position;
    // - 1. Update data
    this.gameObject.transform.position = position;
    // - 2. Update scene
    this.gameObject.sceneInstance!.transform.localPosition = position;
    if (resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    // - 3. Update JSONC
    const updatedValue: Vector3Archive = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObject.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.transform.position);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  public undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Move '${this.gameObject.name}'`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
