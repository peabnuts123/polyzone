import { IComposerComponentData } from "@lib/project/data";
import { BaseSceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";

interface MutationArgs {
  newComponent: IComposerComponentData;
}

export class AddGameObjectComponentMutation extends BaseSceneMutation<MutationArgs> {
  public override readonly useCustomUndo: boolean = true;
  private readonly gameObjectId: string;

  public constructor(gameObjectId: string, newComponent: IComposerComponentData) {
    super({ newComponent });
    this.gameObjectId = gameObjectId;
  }

  public override async apply({ SceneViewController }: SceneViewMutationArguments, { newComponent }: MutationArgs): Promise<void> {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    gameObjectData.components.push(newComponent);

    // 2. Update scene
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    const component = await SceneViewController.createGameObjectComponent(gameObjectData, gameObject, newComponent);
    if (component !== undefined) {
      gameObject.addComponent(component);
    }

    // 3. Update JSONC
    const newComponentDefinition = newComponent.toComponentDefinition();
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[gameObjectData.components.length],
    );
    SceneViewController.sceneJson.mutate(mutationPath, newComponentDefinition, { isArrayInsertion: true });
  }

  protected override customUndo({ SceneViewController }: SceneViewMutationArguments, { newComponent }: MutationArgs): Promise<void> {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentToRemoveDataIndex = gameObjectData.components.findIndex((component) => component.id === newComponent.id);
    gameObjectData.components.splice(componentToRemoveDataIndex, 1);

    // 2. Update scene
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot undo mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    gameObject.removeComponent(newComponent.id);

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[componentToRemoveDataIndex],
    );
    SceneViewController.sceneJson.delete(mutationPath);

    return Promise.resolve();
  }

  public override get description(): string {
    return `Add ${this.args.newComponent.componentName} component`;
  }
}
