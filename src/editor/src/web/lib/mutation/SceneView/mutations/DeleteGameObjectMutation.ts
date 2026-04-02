import { GameObjectData } from "@lib/project/data";
import { BaseSceneMutation } from '../ISceneMutation';
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";

export class DeleteGameObjectMutation extends BaseSceneMutation {
  public override readonly useCustomUndo: boolean = true;

  private readonly gameObjectId: string;
  private readonly gameObjectName: string;

  // Undo data
  private deletedGameObjectDataIndex: number | undefined = undefined;
  private deletedGameObjectData: GameObjectData | undefined = undefined;
  /*
   * @NOTE `null` = no parent
   * `undefined` = value not set
   */
  private deletedGameObjectParentId: string | null | undefined;

  public constructor(gameObject: GameObjectData) {
    super();
    this.gameObjectId = gameObject.id;
    this.gameObjectName = gameObject.name;
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments): Promise<void> {
    // Find object's parent - we're going to remove the object from the parent's children
    const gameObjectData = this.deletedGameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObjectParentData = SceneViewController.scene.getGameObjectParent(this.gameObjectId);
    this.deletedGameObjectParentId = gameObjectParentData?.id ?? null;

    // @NOTE We need to find the game object's position and store it, so we can
    // put it back in the right place when undo is requested.
    const gameObjectDataCollection = (
      gameObjectParentData === undefined ?
        SceneViewController.scene.objects :
        gameObjectParentData.children
    );
    const targetIndex = this.deletedGameObjectDataIndex = gameObjectDataCollection.findIndex((object) => object.id === this.gameObjectId);

    // 1. Update Data
    gameObjectDataCollection.splice(targetIndex, 1);

    // 2. Update Scene
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    SceneViewController.removeGameObject(gameObject);
    gameObject.transform.parent = undefined;
    gameObject.destroy();
    if (SceneViewController.selectionManager.selectedObjectId === gameObjectData.id) {
      SceneViewController.selectionManager.deselectAll();
    }

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
    );
    SceneViewController.sceneJson.delete(mutationPath);

    return Promise.resolve();
  }

  protected override async customUndo({ SceneViewController }: SceneViewMutationArguments): Promise<void> {
    if (this.deletedGameObjectDataIndex === undefined || this.deletedGameObjectDataIndex === -1) {
      throw new Error(`Cannot undo mutation - 'deletedGameObjectDataIndex' hasn't been set. Has the mutation been applied?`);
    }
    if (this.deletedGameObjectData === undefined) {
      throw new Error(`Cannot undo mutation - 'deletedGameObjectData' hasn't been set. Has the mutation been applied?`);
    }
    if (this.deletedGameObjectParentId === undefined) {
      throw new Error(`Cannot undo mutation - 'deletedGameObjectParentId' hasn't been set. Has the mutation been applied?`);
    }

    // @NOTE Basically the same as `CreateGameObjectFromDefinitionMutation.apply()`

    // 1. Update data
    if (this.deletedGameObjectParentId !== null) {
      /* Deleted object had parent */
      // 1. Update Data
      const parentGameObjectData = SceneViewController.scene.getGameObject(this.deletedGameObjectParentId);
      parentGameObjectData.children.splice(this.deletedGameObjectDataIndex, 0, this.deletedGameObjectData);

      // 2. Update Scene
      const parentGameObject = SceneViewController.findGameObjectById(this.deletedGameObjectParentId);
      if (parentGameObject === undefined) throw new Error(`Cannot undo mutation - no game object exists in the scene with id '${this.deletedGameObjectParentId}'`);
      await SceneViewController.createGameObject(this.deletedGameObjectData, parentGameObject.transform);

      // 3. Update JSONC
      const mutationPath = resolvePathForSceneObjectMutation(
        this.deletedGameObjectParentId,
        SceneViewController.sceneDefinition,
        (parentGameObject) => parentGameObject.children![this.deletedGameObjectDataIndex!],
      );
      SceneViewController.sceneJson.mutate(mutationPath, this.deletedGameObjectData.toDefinition(), { isArrayInsertion: true });
    } else {
      // Add directly to scene
      // 1. Update Data
      SceneViewController.scene.objects.splice(this.deletedGameObjectDataIndex, 0, this.deletedGameObjectData);

      // 2. Update Scene
      await SceneViewController.createGameObject(this.deletedGameObjectData);

      // 3. Update JSONC
      SceneViewController.sceneJson.mutate(
        (scene) => scene.objects[this.deletedGameObjectDataIndex!],
        this.deletedGameObjectData.toDefinition(),
        { isArrayInsertion: true },
      );
    }
  }

  public override get description(): string {
    return `Delete '${this.gameObjectName}'`;
  }
}
