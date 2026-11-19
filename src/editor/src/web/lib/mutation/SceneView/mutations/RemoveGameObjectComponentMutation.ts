import { CameraComponentData, GameObjectData, IEditorComponentData, MeshComponentData, ScriptComponentData } from "@lib/project/data";
import { isSelectableObject } from "@lib/common/objects/components";
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
  componentToRemove: IEditorComponentData;
}

export class RemoveGameObjectComponentMutation extends BaseSceneMutation<MutationArgs> {
  protected override readonly useCustomUndo: boolean = true;
  private readonly gameObjectId: string;

  // Undo data
  private removedComponentIndex: number | undefined = undefined;

  public constructor(gameObject: GameObjectData, componentToRemove: IEditorComponentData) {
    super({ componentToRemove });
    this.gameObjectId = gameObject.id;
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments, { componentToRemove }: MutationArgs): void {
    // 1. Update data
    const gameObjectData = SceneViewController.sceneData.getGameObject(this.gameObjectId);
    const componentToRemoveDataIndex = this.removedComponentIndex = gameObjectData.components.findIndex((component) => component.id === componentToRemove.id);
    gameObjectData.components.splice(
      componentToRemoveDataIndex,
      1,
    );

    // 2. Update scene
    // @NOTE Don't need to update scene for certain types (since they aren't instantiated in the composer)
    if (!ComponentTypesThatDontExistInTheComposer.some((Type) => componentToRemove instanceof Type)) {
      const editorObject = SceneViewController.findEditorObjectById(this.gameObjectId);
      if (editorObject === undefined) throw new Error(`Cannot apply mutation - no editor object exists in the scene with id '${this.gameObjectId}'`);
      const sceneComponent = editorObject.getComponent(componentToRemove.id);
      if (isSelectableObject(sceneComponent)) {
        SceneViewController.scene.removeFromSelectionCache(sceneComponent);
      }
      editorObject.removeComponent(componentToRemove.id);

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
    const gameObjectData = SceneViewController.sceneData.getGameObject(this.gameObjectId);
    gameObjectData.components.splice(this.removedComponentIndex, 0, removedComponentData);

    // 2. Update scene
    const editorObject = SceneViewController.findEditorObjectById(this.gameObjectId);
    if (editorObject === undefined) throw new Error(`Cannot apply mutation - no editor object exists in the scene with id '${this.gameObjectId}'`);
    await SceneViewController.scene.createEditorObjectComponent(removedComponentData, editorObject, gameObjectData, this.removedComponentIndex);

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
