import { Vector3Definition as ArchiveVector3 } from "@polyzone/runtime/src/cartridge/archive/util";
import { Vector3 } from "@polyzone/core/src/util";

import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseContinuousSceneMutation } from "../IContinuousSceneMutation";

interface SetGameObjectScaleMutationDeltaUpdateArgs {
  scaleDelta: Vector3;
  resetGizmo?: boolean;
}
interface SetGameObjectScaleMutationAbsoluteUpdateArgs {
  scale: Vector3;
  resetGizmo?: boolean;
}

export type SetGameObjectScaleMutationUpdateArgs = SetGameObjectScaleMutationDeltaUpdateArgs | SetGameObjectScaleMutationAbsoluteUpdateArgs;

export class SetGameObjectScaleMutation extends BaseContinuousSceneMutation<SetGameObjectScaleMutationUpdateArgs> {
  // State
  private readonly gameObjectId: string;

  public constructor(gameObjectId: string) {
    super();
    this.gameObjectId = gameObjectId;
  }

  public override update({ SceneViewController }: SceneViewMutationArguments, updateArgs: SetGameObjectScaleMutationUpdateArgs): void {
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

  public override apply({ SceneViewController }: SceneViewMutationArguments): void {
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

  protected override getRedoArgs(_dependencies: SceneViewMutationArguments, args: SetGameObjectScaleMutationUpdateArgs): SetGameObjectScaleMutationUpdateArgs {
    // @NOTE Always reset gizmo for redo
    return {
      ...args,
      resetGizmo: true,
    };
  }

  protected override getUndoArgs({ SceneViewController }: SceneViewMutationArguments): SetGameObjectScaleMutationUpdateArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    return {
      scale: gameObjectData.transform.scale.clone(),
      resetGizmo: true,
    };
  }

  public override get description(): string {
    return `Scale object`;
  }
}
