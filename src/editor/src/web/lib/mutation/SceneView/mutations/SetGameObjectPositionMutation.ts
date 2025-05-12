import { Vector3Definition as Vector3Archive } from "@polyzone/runtime/src/cartridge/archive/util";
import { Vector3 } from "@polyzone/core/src/util";

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
  private readonly gameObjectId: string;
  private _hasBeenApplied: boolean = false;

  // Undo state
  private oldDataPosition: Vector3 | undefined = undefined;
  private oldScenePosition: Vector3 | undefined = undefined;


  public constructor(gameObjectId: string) {
    this.gameObjectId = gameObjectId;
  }

  public begin({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot begin mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - Store undo values
    this.oldDataPosition = gameObjectData.transform.position;
    this.oldScenePosition = gameObject.transform.position;
  }

  public update({ SceneViewController }: SceneViewMutationArguments, { position, resetGizmo }: SetGameObjectPositionMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - 1. Update data
    gameObjectData.transform.position = position;
    // - 2. Update scene
    gameObject.transform.localPosition = position;
    if (resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    // - 3. Update JSONC
    const updatedValue: Vector3Archive = {
      x: gameObjectData.transform.position.x,
      y: gameObjectData.transform.position.y,
      z: gameObjectData.transform.position.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(gameObjectData.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.transform.position);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  public undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Move object`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
