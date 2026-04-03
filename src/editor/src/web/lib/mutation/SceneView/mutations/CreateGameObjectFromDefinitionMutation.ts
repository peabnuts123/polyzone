import { v4 as uuid } from 'uuid';

import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";

import { GameObjectData, loadObjectDefinition } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from '@lib/mutation/util';
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseSceneMutation } from '../ISceneMutation';
import { SiblingTarget } from './SetGameObjectParentMutation';


// @TODO enumify
export const CreateGameObjectType = {
  CreateNew: 'CreateNew',
  Paste: 'Paste',
  Duplicate: 'Duplicate',
} as const;
export type CreateGameObjectTypeValue = keyof typeof CreateGameObjectType;

export interface CreateGameObjectFromDefinitionMutationArgs {
  type: CreateGameObjectTypeValue
  definition: GameObjectDefinition;
  parent?: GameObjectData;
  siblingTarget?: SiblingTarget;
}

export class CreateGameObjectFromDefinitionMutation extends BaseSceneMutation {
  public override readonly useCustomUndo: boolean = true;

  private readonly type: CreateGameObjectTypeValue;
  private readonly definition: GameObjectDefinition;
  private readonly parentGameObjectId: string | undefined;
  private readonly siblingTarget: SiblingTarget | undefined;

  public constructor({
    type,
    definition,
    siblingTarget,
    parent,
  }: CreateGameObjectFromDefinitionMutationArgs) {
    super();
    this.type = type;
    this.parentGameObjectId = parent?.id;
    this.siblingTarget = siblingTarget;

    let shouldScrambleIds: boolean;
    switch (type) {
      case 'CreateNew':
        shouldScrambleIds = false;
        break;
      case 'Paste':
      case 'Duplicate':
        shouldScrambleIds = true;
        break;
      default:
        throw new Error(`Unimplemented type '${type}'`);
    }
    this.definition = shouldScrambleIds ? this.scrambleIds(definition) : definition;
  }

  private scrambleIds(definition: GameObjectDefinition): GameObjectDefinition {
    // Game Object ID
    definition.id = uuid();
    // Components
    definition.components.forEach((component) => {
      component.id = uuid();
    });
    // Children
    definition.children?.forEach((child) => {
      this.scrambleIds(child);
    });
    return definition;
  }

  public override async apply({ SceneViewController, ProjectController }: SceneViewMutationArguments): Promise<void> {
    // Create new object
    const newGameObjectData = loadObjectDefinition(this.definition, ProjectController.project.assets);

    // 0. Determine target index
    const gameObjectDataCollection = (
      this.parentGameObjectId !== undefined ?
        SceneViewController.scene.getGameObject(this.parentGameObjectId).children :
        SceneViewController.scene.objects
    );
    let targetIndex = gameObjectDataCollection.length;
    if (this.siblingTarget) {
      const siblingTargetIndex = gameObjectDataCollection.findIndex((child) => child.id === this.siblingTarget!.gameObjectId);
      if (siblingTargetIndex === -1) throw new Error(`Cannot apply mutation - parent does not have child with siblingTarget id '${this.siblingTarget.gameObjectId}'`);
      switch (this.siblingTarget.type) {
        case 'before':
          targetIndex = siblingTargetIndex;
          break;
        case 'after':
          targetIndex = siblingTargetIndex + 1;
          break;
        default:
          throw new Error(`Unimplemented sibling target type: '${(this.siblingTarget as { type: string }).type}'`);
      }
    }

    // 1. Update data
    if (this.parentGameObjectId !== undefined) {
      // Add as a child of a pre-existing parent
      // 1. Update Data
      const parentGameObjectData = SceneViewController.scene.getGameObject(this.parentGameObjectId);
      parentGameObjectData.children.splice(targetIndex, 0, newGameObjectData);

      // 2. Update Scene
      const parentGameObject = SceneViewController.findGameObjectById(this.parentGameObjectId);
      if (parentGameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.parentGameObjectId}'`);
      await SceneViewController.createGameObject(newGameObjectData, parentGameObject.transform);

      // 3. Update JSONC
      const mutationPath = resolvePathForSceneObjectMutation(
        this.parentGameObjectId,
        SceneViewController.sceneDefinition,
        (parentGameObject) => parentGameObject.children![targetIndex],
      );
      SceneViewController.sceneJson.mutate(mutationPath, this.definition, { isArrayInsertion: true });
    } else {
      // Add directly to scene
      // 1. Update Data
      SceneViewController.scene.objects.splice(targetIndex, 0, newGameObjectData);

      // 2. Update Scene
      await SceneViewController.createGameObject(newGameObjectData);

      // 3. Update JSONC
      SceneViewController.sceneJson.mutate(
        (scene) => scene.objects[targetIndex],
        this.definition,
        { isArrayInsertion: true },
      );
    }

    SceneViewController.selectionManager.select(newGameObjectData.id);
  }

  protected override customUndo({ SceneViewController }: SceneViewMutationArguments): Promise<void> {
    // @NOTE Basically the same as `DeleteGameObjectMutation.apply()`
    // Find object's parent - we're going to remove the object from the parent's children
    const gameObjectData = SceneViewController.scene.getGameObject(this.definition.id);
    const gameObjectParentData = SceneViewController.scene.getGameObjectParent(this.definition.id);

    // 1. Update Data
    if (gameObjectParentData === undefined) {
      // Top-level object
      SceneViewController.scene.objects = SceneViewController.scene.objects.filter((object) => object.id !== this.definition.id);
    } else {
      // Child object
      gameObjectParentData.children = gameObjectParentData.children.filter((object) => object.id !== this.definition.id);
    }

    // 2. Update Scene
    const gameObject = SceneViewController.findGameObjectById(this.definition.id);
    if (gameObject === undefined) throw new Error(`Cannot undo mutation - no game object exists in the scene with id '${this.definition.id}'`);
    SceneViewController.removeGameObject(gameObject);
    gameObject.transform.parent = undefined;
    gameObject.destroy();
    if (SceneViewController.selectionManager.selectedObjectId === gameObjectData.id) {
      SceneViewController.selectionManager.deselectAll();
    }

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.definition.id,
      SceneViewController.sceneDefinition,
    );
    SceneViewController.sceneJson.delete(mutationPath);

    return Promise.resolve();
  }

  public override get description(): string {
    switch (this.type) {
      case 'CreateNew':
        return `Create new object`;
      case 'Paste':
        return `Paste object`;
      case 'Duplicate':
        return `Duplicate object`;
      default:
        console.error(`[${CreateGameObjectFromDefinitionMutation.name}] Unimplemented type: ${this.type}`);
        return `Create object`;
    }
  }
}
