import { IComposerComponentData } from "@lib/project/data";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";

export class AddGameObjectComponentMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly newComponent: IComposerComponentData;

  public constructor(gameObjectId: string, newComponent: IComposerComponentData) {
    this.gameObjectId = gameObjectId;
    this.newComponent = newComponent;
  }

  async apply({ SceneViewController }: SceneViewMutationArguments): Promise<void> {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    gameObjectData.components.push(this.newComponent);

    // 2. Update scene
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    // @NOTE Async logic not awaited until the end - keep processing mutation while we wait
    const createGameObjectComponentPromise = SceneViewController.createGameObjectComponent(gameObjectData, gameObject, this.newComponent);

    // 3. Update JSONC
    const newComponentDefinition = this.newComponent.toComponentDefinition();
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[gameObjectData.components.length],
    );
    SceneViewController.sceneJson.mutate(mutationPath, newComponentDefinition, { isArrayInsertion: true });

    // Ensure async logic has completed
    await createGameObjectComponentPromise;
  }

  undo(_args: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Add ${this.newComponent.componentName} component`;
  }
}
