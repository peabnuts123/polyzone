import { GameObjectComponent } from "@polyzone/core/src/world";
import { CameraComponentData, GameObjectData, IComposerComponentData, MeshComponentData, ScriptComponentData } from "@lib/project/data";
import { isSelectableObject } from "@lib/composer/scene/components";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { BaseSceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

// Constants
/** Certain components aren't instantiated in the composer and need to be ignored */
const ComponentTypesThatDontExistInTheComposer = [
  CameraComponentData,
  ScriptComponentData,
];

interface MutationArgs {
  componentToRemove: IComposerComponentData;
}

export class RemoveGameObjectComponentMutation extends BaseSceneMutation<MutationArgs> {
  protected override readonly useCustomUndo: boolean = true;
  private readonly gameObjectId: string;

  // Undo data
  private removedComponentIndex: number | undefined = undefined;

  public constructor(gameObject: GameObjectData, componentToRemove: IComposerComponentData) {
    super({ componentToRemove });
    this.gameObjectId = gameObject.id;
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments, { componentToRemove }: MutationArgs): void {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentToRemoveDataIndex = this.removedComponentIndex = gameObjectData.components.findIndex((component) => component.id === componentToRemove.id);
    gameObjectData.components.splice(
      componentToRemoveDataIndex,
      1,
    );

    // 2. Update scene
    // @NOTE Don't need to update scene for certain types (since they aren't instantiated in the composer)
    if (!ComponentTypesThatDontExistInTheComposer.some((Type) => componentToRemove instanceof Type)) {
      const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
      if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
      const sceneComponent = gameObject.getComponent(componentToRemove.id, GameObjectComponent);
      if (isSelectableObject(sceneComponent)) {
        SceneViewController.removeFromSelectionCache(sceneComponent);
      }
      gameObject.removeComponent(componentToRemove.id);

      // - Update selection gizmo if component was a mesh
      if (componentToRemove instanceof MeshComponentData) {
        SceneViewController.selectionManager.updateGizmos();
      }
    }

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[componentToRemoveDataIndex],
    );
    SceneViewController.sceneJson.delete(mutationPath);
  }

  protected override async customUndo({ SceneViewController }: SceneViewMutationArguments, { componentToRemove: removedComponentData }: MutationArgs): Promise<void> {
    if (this.removedComponentIndex === undefined || this.removedComponentIndex === -1) {
      throw new Error(`Cannot undo mutation - 'removedComponentIndex' hasn't been set. Has the mutation been applied?`);
    }

    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    gameObjectData.components.splice(this.removedComponentIndex, 0, removedComponentData);

    // 2. Update scene
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    const removedComponent = await SceneViewController.createGameObjectComponent(gameObjectData, gameObject, removedComponentData);
    if (removedComponent !== undefined) {
      gameObject.components.splice(this.removedComponentIndex, 0, removedComponent);
    }

    // 3. Update JSONC
    const newComponentDefinition = removedComponentData.toComponentDefinition();
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[this.removedComponentIndex!],
    );
    SceneViewController.sceneJson.mutate(mutationPath, newComponentDefinition, { isArrayInsertion: true });
  }

  public override get description(): string {
    return `Remove ${this.args.componentToRemove.componentName} component`;
  }
}
