import { Vector3 } from "@polyzone/core/src/util";
import { toVector3Definition } from "@polyzone/runtime/src/util";

import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectPositionMutationUpdateArgs {
  position: Vector3;
  resetGizmo?: boolean;
}

export class SetGameObjectPositionMutation extends BaseContinuousSceneMutation<SetGameObjectPositionMutationUpdateArgs> {
  // State
  private readonly gameObjectId: string;


  public constructor(gameObjectId: string) {
    super();
    this.gameObjectId = gameObjectId;
  }

  public update({ SceneViewController }: SceneViewMutationArguments, { position, resetGizmo }: SetGameObjectPositionMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - 1. Update data
    gameObjectData.transform.position = position;

    // - 2. Update scene
    gameObject.transform.localPosition.setValue(position);
    if (resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    // - 3. Update JSONC
    const updatedValue = toVector3Definition(gameObjectData.transform.position);
    const mutationPath = resolvePathForSceneObjectMutation(gameObjectData.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.transform.position);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  protected getUndoArgs({ SceneViewController }: SceneViewMutationArguments): SetGameObjectPositionMutationUpdateArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    return {
      position: gameObjectData.transform.position,
      resetGizmo: true,
    };
  }

  public get description(): string {
    return `Move object`;
  }
}
