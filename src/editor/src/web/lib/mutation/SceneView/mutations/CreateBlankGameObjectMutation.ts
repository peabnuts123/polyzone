import { runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";
import { toVector3Core } from '@polyzone/runtime/src/util';
import { Quaternion } from '@polyzone/core/src/util/Quaternion';

import { GameObjectData, loadObjectDefinition } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from '@lib/mutation/util';
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { ISceneMutation } from '../ISceneMutation';

export class CreateBlankGameObjectMutation implements ISceneMutation {
  // Mutation state
  private readonly parentGameObjectId: string | undefined;

  public constructor(parent: GameObjectData | undefined = undefined) {
    this.parentGameObjectId = parent?.id;
  }

  public async apply({ SceneViewController, ProjectController }: SceneViewMutationArguments): Promise<void> {
    // Create new object
    const newObjectDefinition: GameObjectDefinition = {
      id: uuid(),
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
      SceneViewController.createGameObject(newGameObjectData);

      // 3. Update JSONC
      SceneViewController.sceneJson.mutate((scene) => scene.objects[SceneViewController.sceneDefinition.objects.length], newObjectDefinition, { isArrayInsertion: true });
    }
  }

  undo({ }: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Create new object`;
  }
}
