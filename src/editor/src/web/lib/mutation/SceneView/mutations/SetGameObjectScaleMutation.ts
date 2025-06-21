import { Vector3Definition as ArchiveVector3 } from "@polyzone/runtime/src/cartridge/archive/util";
import { Vector3 } from "@polyzone/core/src/util";

import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

interface SetGameObjectScaleMutationDeltaUpdateArgs {
  scaleDelta: Vector3;
  resetGizmo?: boolean;
}
interface SetGameObjectScaleMutationAbsoluteUpdateArgs {
  scale: Vector3;
  resetGizmo?: boolean;
}

export type SetGameObjectScaleMutationUpdateArgs = SetGameObjectScaleMutationDeltaUpdateArgs | SetGameObjectScaleMutationAbsoluteUpdateArgs;

export class SetGameObjectScaleMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectScaleMutationUpdateArgs> {
  // State
  private readonly gameObjectId: string;
  private _hasBeenApplied: boolean = false;
  // Undo state
  private oldDataScale: Vector3 | undefined = undefined;
  private oldSceneScale: Vector3 | undefined = undefined;


  public constructor(gameObjectId: string) {
    this.gameObjectId = gameObjectId;
  }

  begin({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot begin mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - Store undo values
    this.oldDataScale = gameObjectData.transform.scale;
    this.oldSceneScale = gameObject.transform.localScale;
  }

  update({ SceneViewController }: SceneViewMutationArguments, updateArgs: SetGameObjectScaleMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot update mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    if ('scaleDelta' in updateArgs) {
      const { scaleDelta } = updateArgs;
      // - 1. Update Data
      gameObjectData.transform.scale.multiplySelf(scaleDelta);
      // - 2. Update Scene
      gameObject.transform.localScale.multiplySelf(scaleDelta);
    } else {
      const { scale } = updateArgs;
      // - 1. Update Data
      gameObjectData.transform.scale = scale;
      // - 2. Update Scene
      gameObject.transform.localScale.setValue(scale);
    }

    if (updateArgs.resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    // - 3. Update JSONC
    const updatedValue: ArchiveVector3 = {
      x: gameObjectData.transform.scale.x,
      y: gameObjectData.transform.scale.y,
      z: gameObjectData.transform.scale.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(gameObjectData.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.transform.scale);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Scale object`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
