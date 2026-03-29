import { runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";
import { toVector3Core } from '@polyzone/runtime/src/util';
import { Quaternion } from '@polyzone/core/src/util/Quaternion';

import { GameObjectData, loadObjectDefinition } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from '@lib/mutation/util';
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseSceneMutation } from '../ISceneMutation';

interface MutationArgs {
  newObjectId: string;
}

export class CreateBlankGameObjectMutation extends BaseSceneMutation<MutationArgs> {
  public override readonly useCustomUndo: boolean = true;
  private readonly parentGameObjectId: string | undefined;

  public constructor(parent: GameObjectData | undefined = undefined) {
    super({ newObjectId: uuid() });
    this.parentGameObjectId = parent?.id;
  }

  public override async apply({ SceneViewController, ProjectController }: SceneViewMutationArguments, { newObjectId }: MutationArgs): Promise<void> {
    // Create new object
    const newObjectDefinition: GameObjectDefinition = {
      id: newObjectId,
      name: "New Object",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      children: [],
      components: [],
    };
    const newGameObjectData = loadObjectDefinition(newObjectDefinition, ProjectController.project.assets);


    if (this.parentGameObjectId !== undefined) {
      // Add as a child of a pre-existing parent
      // 1. Update Data
      const parentGameObjectData = SceneViewController.scene.getGameObject(this.parentGameObjectId);
      parentGameObjectData.children.push(newGameObjectData);

      // 2. Update Scene
      const parentGameObject = SceneViewController.findGameObjectById(this.parentGameObjectId);
      if (parentGameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.parentGameObjectId}'`);
      const newGameObject = await SceneViewController.createGameObject(newGameObjectData, parentGameObject.transform);
      runInAction(() => {
        // Kind of entirely un-necessary 🤷‍♀️ Because the default values will already match
        newGameObject.transform.localPosition.setValue(toVector3Core(newObjectDefinition.transform.position));
        newGameObject.transform.localRotation.setValue(Quaternion.fromEuler(toVector3Core(newObjectDefinition.transform.rotation)));
        newGameObject.transform.localScale.setValue(toVector3Core(newObjectDefinition.transform.scale));
      });

      // 3. Update JSONC
      const mutationPath = resolvePathForSceneObjectMutation(
        this.parentGameObjectId,
        SceneViewController.sceneDefinition,
        (parentGameObject) => parentGameObject.children![parentGameObjectData.children.length],
      );
      SceneViewController.sceneJson.mutate(mutationPath, newObjectDefinition, { isArrayInsertion: true });
    } else {
      // Add directly to scene
      // 1. Update Data
      SceneViewController.scene.objects.push(newGameObjectData);

      // 2. Update Scene
      await SceneViewController.createGameObject(newGameObjectData);

      // 3. Update JSONC
      SceneViewController.sceneJson.mutate((scene) => scene.objects[SceneViewController.sceneDefinition.objects.length], newObjectDefinition, { isArrayInsertion: true });
    }
  }

  protected override customUndo({ SceneViewController }: SceneViewMutationArguments, { newObjectId }: MutationArgs): Promise<void> {
    // @NOTE same as `DeleteGameObjectMutation.apply()`
    // Find object's parent - we're going to remove the object from the parent's children
    const gameObjectData = SceneViewController.scene.getGameObject(newObjectId);
    const gameObjectParentData = SceneViewController.scene.getGameObjectParent(newObjectId);

    // 1. Update Data
    if (gameObjectParentData === undefined) {
      // Top-level object
      SceneViewController.scene.objects = SceneViewController.scene.objects.filter((object) => object.id !== newObjectId);
    } else {
      // Child object
      gameObjectParentData.children = gameObjectParentData.children.filter((object) => object.id !== newObjectId);
    }

    // 2. Update Scene
    const gameObject = SceneViewController.findGameObjectById(newObjectId);
    if (gameObject === undefined) throw new Error(`Cannot undo mutation - no game object exists in the scene with id '${newObjectId}'`);
    SceneViewController.removeGameObject(gameObject);
    gameObject.transform.parent = undefined;
    gameObject.destroy();
    if (SceneViewController.selectionManager.selectedObjectId === gameObjectData.id) {
      SceneViewController.selectionManager.deselectAll();
    }

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      newObjectId,
      SceneViewController.sceneDefinition,
    );
    SceneViewController.sceneJson.delete(mutationPath);

    return Promise.resolve();
  }

  public override get description(): string {
    return `Create new object`;
  }
}
