import { Vector3Definition as ArchiveVector3 } from "@polyzone/runtime/src/cartridge/archive/util";
import { Vector3 } from "@polyzone/core/src/util";

import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectRotationMutationUpdateArgs {
  rotation: Vector3;
  resetGizmo?: boolean;
}

export class SetGameObjectRotationMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectRotationMutationUpdateArgs> {
  // State
  private readonly gameObjectId: string;
  private _hasBeenApplied: boolean = false;

  // Undo state
  private oldDataRotation: Vector3 | undefined = undefined;
  private oldSceneRotation: Vector3 | undefined = undefined;


  public constructor(gameObjectId: string) {
    this.gameObjectId = gameObjectId;
  }

  begin({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot begin mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - Store undo values
    this.oldDataRotation = gameObjectData.transform.rotation;
    this.oldSceneRotation = gameObject.transform.rotation;
  }

  update({ SceneViewController }: SceneViewMutationArguments, { rotation, resetGizmo }: SetGameObjectRotationMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot update mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - 1. Update Data
    gameObjectData.transform.rotation = rotation;
    // - 2. Update Scene
    gameObject.transform.localRotation.setValue(rotation);
    if (resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    // - 3. Update JSONC
    const updatedValue: ArchiveVector3 = {
      x: gameObjectData.transform.rotation.x,
      y: gameObjectData.transform.rotation.y,
      z: gameObjectData.transform.rotation.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(gameObjectData.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.transform.rotation);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Rotate object`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
