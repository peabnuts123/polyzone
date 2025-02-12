import { v4 as uuid } from 'uuid';

import { GameObjectDefinition } from "@fantasy-console/runtime/src/cartridge";

import { GameObjectData, loadObjectDefinition } from "@lib/project/data";
import { ISceneMutation } from '../ISceneMutation';
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { resolvePathForSceneObjectMutation } from '@lib/mutation/util';
import { toVector3Core } from '@fantasy-console/runtime/src/util';

export class CreateBlankGameObjectMutation implements ISceneMutation {
  // Mutation state
  private readonly parentGameObjectId: string | undefined;

  public constructor(parent: GameObjectData | undefined = undefined) {
    this.parentGameObjectId = parent?.id;
  }

  apply({ SceneViewController, ProjectController }: SceneViewMutationArguments): void {
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
      const parentGameObject = parentGameObjectData.sceneInstance!;
      SceneViewController.createGameObject(newGameObjectData).then((newGameObject) => {
        newGameObject.transform.parent = parentGameObject.transform;
        newGameObject.transform.localPosition = toVector3Core(newObjectDefinition.transform.position);
        newGameObject.transform.localRotation = toVector3Core(newObjectDefinition.transform.rotation);
        newGameObject.transform.localScale = toVector3Core(newObjectDefinition.transform.scale);
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
