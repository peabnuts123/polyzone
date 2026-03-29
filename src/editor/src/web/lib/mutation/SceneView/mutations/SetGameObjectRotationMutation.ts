import { Vector3Definition as ArchiveVector3 } from "@polyzone/runtime/src/cartridge/archive/util";
import { Quaternion } from "@polyzone/core/src/util/Quaternion";

import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectRotationMutationUpdateArgs {
  rotation: Quaternion;
  resetGizmo?: boolean;
}

export class SetGameObjectRotationMutation extends BaseContinuousSceneMutation<SetGameObjectRotationMutationUpdateArgs> {
  // State
  private readonly gameObjectId: string;

  public constructor(gameObjectId: string) {
    super();
    this.gameObjectId = gameObjectId;
  }

  public override update({ SceneViewController }: SceneViewMutationArguments, { rotation, resetGizmo }: SetGameObjectRotationMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot update mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - 1. Update Data
    gameObjectData.transform.rotation = rotation.toEuler();
    // - 2. Update Scene
    gameObject.transform.localRotation.setValue(rotation);
    if (resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments): void {
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

  protected override getRedoArgs(_dependencies: SceneViewMutationArguments, args: SetGameObjectRotationMutationUpdateArgs): SetGameObjectRotationMutationUpdateArgs {
    // @NOTE Always reset gizmo for redo
    return {
      ...args,
      resetGizmo: true,
    };
  }

  protected override getUndoArgs({ SceneViewController }: SceneViewMutationArguments): SetGameObjectRotationMutationUpdateArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    return {
      rotation: Quaternion.fromEuler(gameObjectData.transform.rotation),
      resetGizmo: true,
    };
  }

  public override get description(): string {
    return `Rotate object`;
  }
}
