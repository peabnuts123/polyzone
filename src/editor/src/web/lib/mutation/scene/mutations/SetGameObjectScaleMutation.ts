import { Vector3Definition as ArchiveVector3 } from "@polyzone/runtime/src/cartridge/archive/util";
import { Vector3 } from "@polyzone/core/src/util";

import { GameObjectData } from "@lib/project/data";
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
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectData;
  private scale: Vector3;
  private _hasBeenApplied: boolean = false;
  // Undo state
  private configScale: Vector3 | undefined = undefined;
  private sceneScale: Vector3 | undefined = undefined;


  public constructor(gameObject: GameObjectData) {
    this.gameObject = gameObject;
    this.scale = gameObject.transform.scale.clone();
  }

  begin(_args: SceneViewMutationArguments): void {
    // - Store undo values
    this.configScale = this.gameObject.transform.scale;
    this.sceneScale = this.gameObject.sceneInstance!.transform.scale;
  }

  update({ SceneViewController }: SceneViewMutationArguments, updateArgs: SetGameObjectScaleMutationUpdateArgs): void {
    if ('scaleDelta' in updateArgs) {
      const { scaleDelta } = updateArgs;
      this.scale.multiplySelf(scaleDelta);
      // - 1. Update Data
      this.gameObject.transform.scale.multiplySelf(scaleDelta);
      // - 2. Update Scene
      this.gameObject.sceneInstance!.transform.localScale.multiplySelf(scaleDelta);
    } else {
      const { scale } = updateArgs;
      this.scale = scale;
      // - 1. Update Data
      this.gameObject.transform.scale = scale;
      // - 2. Update Scene
      this.gameObject.sceneInstance!.transform.localScale = scale;
    }

    if (updateArgs.resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    // - 3. Update JSONC
    const updatedValue: ArchiveVector3 = {
      x: this.scale.x,
      y: this.scale.y,
      z: this.scale.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObject.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.transform.scale);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Scale '${this.gameObject.name}'`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
