import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectNameMutationUpdateArgs {
  name: string;
}

export class SetGameObjectNameMutation extends BaseContinuousSceneMutation<SetGameObjectNameMutationUpdateArgs> {
  // State
  private readonly gameObjectId: string;

  public constructor(gameObjectId: string) {
    super();
    this.gameObjectId = gameObjectId;
  }

  public override update({ SceneViewController }: SceneViewMutationArguments, { name }: SetGameObjectNameMutationUpdateArgs): Promise<void> {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot update mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - 1. Data
    gameObjectData.name = name;
    // - 2. Babylon state
    gameObject.name = name;

    return Promise.resolve();
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments): Promise<void> {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    // - 3. JSONC
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObjectId, SceneViewController.sceneDefinition, (gameObject) => gameObject.name);
    SceneViewController.sceneJson.mutate(mutationPath, gameObjectData.name);

    return Promise.resolve();
  }

  protected override getUndoArgs({ SceneViewController }: SceneViewMutationArguments): SetGameObjectNameMutationUpdateArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    return {
      name: gameObjectData.name,
    };
  }

  public override get description(): string {
    return `Rename object`;
  }
}
