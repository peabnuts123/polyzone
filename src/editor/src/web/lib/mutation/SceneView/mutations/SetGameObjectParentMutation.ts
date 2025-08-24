import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";
import { toVector3Definition } from "@polyzone/runtime/src/util";

import { GameObjectData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { MutationPath, readValueAtPath, resolvePath } from "@lib/util/JsoncContainer";
import { SceneDefinition } from "@lib/project/definition/scene/SceneDefinition";
import { BaseSceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

interface SetGameObjectParentMutationArgs {
  gameObject: GameObjectData;
  newParent: GameObjectData | undefined;
}
interface SetGameObjectParentMutationBeforeArgs extends SetGameObjectParentMutationArgs {
  before: GameObjectData;
}
interface SetGameObjectParentMutationAfterArgs extends SetGameObjectParentMutationArgs {
  after: GameObjectData;
}

interface SiblingTarget {
  type: 'before' | 'after',
  gameObjectId: string;
}

interface MutationArgs {
  newParentId: string | undefined;
  siblingTarget: SiblingTarget | undefined;
}

export class SetGameObjectParentMutation extends BaseSceneMutation<MutationArgs> {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly gameObjectName: string;

  public constructor(args: SetGameObjectParentMutationArgs | SetGameObjectParentMutationBeforeArgs | SetGameObjectParentMutationAfterArgs) {
    const { gameObject, newParent } = args;

    const mutationArgs: MutationArgs = {
      newParentId: newParent?.id,
      siblingTarget: undefined,
    };

    if ('before' in args) {
      mutationArgs.siblingTarget = {
        type: 'before',
        gameObjectId: args.before.id,
      };
    } else if ('after' in args) {
      mutationArgs.siblingTarget = {
        type: 'after',
        gameObjectId: args.after.id,
      };
    } else {
      mutationArgs.siblingTarget = undefined;
    }

    super(mutationArgs);

    this.gameObjectId = gameObject.id;
    this.gameObjectName = gameObject.name;
  }

  public apply({ SceneViewController }: SceneViewMutationArguments, { newParentId, siblingTarget }: MutationArgs): void {
    // 1A. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const newParentData = newParentId !== undefined ? SceneViewController.scene.getGameObject(newParentId) : undefined;
    const newSiblingDataCollection = newParentData !== undefined ?
      newParentData.children :
      SceneViewController.scene.objects;
    const currentParentData = SceneViewController.scene.getGameObjectParent(this.gameObjectId);
    const currentParentChildrenData = currentParentData !== undefined ? currentParentData.children : SceneViewController.scene.objects;

    // Remove from old parent
    const currentGameObjectDataIndex = currentParentChildrenData.findIndex((child) => child.id === this.gameObjectId);
    if (currentGameObjectDataIndex === -1) throw new Error(`Cannot apply mutation - cannot find object with ID '${this.gameObjectId}' ${currentParentData === undefined ? "as top-level object" : `as child of object with ID '${currentParentData.id}'`}`);
    currentParentChildrenData.splice(currentGameObjectDataIndex, 1);

    // Add to new parent
    if (siblingTarget === undefined) {
      // No specific index in children, just add new child
      newSiblingDataCollection.push(gameObjectData);
    } else {
      // Add object before/after specific child
      const siblingIndex = newSiblingDataCollection.findIndex((object) => object.id === siblingTarget.gameObjectId);
      if (siblingIndex === -1) throw new Error(`Cannot apply mutation - cannot find object with ID '${siblingTarget.gameObjectId}' ${newParentId === undefined ? "as top-level object" : `as child of object with ID '${newParentId}'`}`);
      if (siblingTarget.type === 'before') {
        if (siblingIndex === 0) {
          // Add item as first child
          newSiblingDataCollection.unshift(gameObjectData);
        } else {
          // Insert item before sibling
          newSiblingDataCollection.splice(siblingIndex, 0, gameObjectData);
        }
      } else {
        if (siblingIndex === newSiblingDataCollection.length - 1) {
          // Add item as last child
          newSiblingDataCollection.push(gameObjectData);
        } else {
          // Insert item after sibling
          newSiblingDataCollection.splice(siblingIndex + 1, 0, gameObjectData);
        }
      }
    }

    // 1B*
    // Now we need to update the object's transform so that it doesn't move in world space
    // This involves recalculating the absolute position / rotation / scale of the object
    //  which we could do but would be complicated and error-prone. We can instead just update the
    //  Babylon scene and read the results from there.

    // 2. Update scene
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    if (newParentData !== undefined) {
      // Set parent to new object
      const newParent = SceneViewController.findGameObjectById(newParentData.id);
      if (newParent === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${newParentData.id}'`);

      gameObject.transform.parent = newParent.transform;
    } else {
      // Set parent to undefined i.e. top-level object
      gameObject.transform.parent = undefined;
    }
    // @TODO update World list of object instances if parent is null (?)

    // 1B. Update transform with new absolute values
    const newLocalPosition = gameObject.transform.localPosition;
    const newLocalRotation = gameObject.transform.localRotation.toEuler();
    const newLocalScale = gameObject.transform.localScale;

    gameObjectData.transform.position = newLocalPosition;
    gameObjectData.transform.rotation = newLocalRotation;
    gameObjectData.transform.scale = newLocalScale;

    // 3. Update JSONC
    // Find the current path of the game object that is being reparented
    const currentPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
    );
    // Store the current definition of the game object being reparented
    const currentDefinitionValue = readValueAtPath(currentPath, SceneViewController.sceneDefinition);
    // Remove the target game object from the scene definition
    SceneViewController.sceneJson.delete(currentPath);

    // Update object definition before writing back to JSON
    currentDefinitionValue.transform.position = toVector3Definition(newLocalPosition);
    currentDefinitionValue.transform.rotation = toVector3Definition(newLocalRotation);
    currentDefinitionValue.transform.scale = toVector3Definition(newLocalScale);

    // Read parent data (if specified)
    let newParentDefinition: GameObjectDefinition | undefined = undefined;
    if (newParentId !== undefined) {
      const newParentPath = resolvePathForSceneObjectMutation(
        newParentId,
        SceneViewController.sceneDefinition,
      );
      newParentDefinition = readValueAtPath(newParentPath, SceneViewController.sceneDefinition);
    }

    // Find the new path of the thing
    let newJsonPath: MutationPath<GameObjectDefinition>;
    if (siblingTarget === undefined) {
      // No specific index in children, just add new child
      if (newParentDefinition === undefined) {
        // Object is to be a top-level object
        newJsonPath = resolvePath((scene: SceneDefinition) => scene.objects[SceneViewController.sceneDefinition.objects.length]);
      } else {
        // Object is to be a child of another object
        newJsonPath = resolvePathForSceneObjectMutation(
          newParentId!,
          SceneViewController.sceneDefinition,
          (newParent) => newParent.children![newParentDefinition?.children?.length ?? 0],
        );
      }
    } else {
      // Add object before/after specific child sibling
      const indexOffset = siblingTarget.type === 'before' ? 0 : 1;
      if (newParentDefinition === undefined) {
        // Sibling is a top-level object
        const siblingJsonIndex = SceneViewController.sceneDefinition.objects.findIndex((object) => object.id === siblingTarget.gameObjectId);
        newJsonPath = resolvePath((scene: SceneDefinition) => scene.objects[siblingJsonIndex + indexOffset]);
      } else {
        // Sibling is a child of another object
        const siblingJsonIndex = newParentDefinition?.children?.findIndex((object) => object.id === siblingTarget.gameObjectId);
        if (siblingJsonIndex === undefined) {
          throw new Error(`Cannot apply mutation - cannot find object with ID '${siblingTarget.gameObjectId}' ${newParentId === undefined ? "as top-level object" : `as child of object with ID '${newParentId}'`}`);
        }
        newJsonPath = resolvePathForSceneObjectMutation(
          newParentId!,
          SceneViewController.sceneDefinition,
          (newParent) => newParent.children![siblingJsonIndex + indexOffset],
        );
      }
    }

    // Add the definition at the new path
    SceneViewController.sceneJson.mutate(newJsonPath, currentDefinitionValue, { isArrayInsertion: true });
  }

  protected getUndoArgs({ SceneViewController }: SceneViewMutationArguments): MutationArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const parentGameObjectData = SceneViewController.scene.getGameObjectParent(this.gameObjectId);

    /*
      @NOTE We need to figure out the current GameObject's parent and (if it has a parent)
      its position within its parent's list of children.
     */

    function calculateSiblingTarget(siblings: GameObjectData[]): SiblingTarget | undefined {
      if (siblings.length === 1) {
        // GameObject HAS NO siblings
        return undefined;
      } else if (siblings[0] === gameObjectData) {
        // GameObject is the first child of its siblings AND it has at least one sibling.
        // It MUST have a sibling after it in the array of children
        return {
          type: 'before',
          gameObjectId: siblings[1].id,
        };
      } else {
        // GameObject is NOT the first child of its siblings AND it has at least one sibling
        // There MUST be a sibling that comes before it in the array of children
        const gameObjectSiblingIndex = siblings.indexOf(gameObjectData) - 1;
        return {
          type: 'after',
          gameObjectId: siblings[gameObjectSiblingIndex].id,
        };
      }
    }

    if (parentGameObjectData === undefined) {
      // GameObject HAS NO parent
      return {
        newParentId: undefined,
        siblingTarget: calculateSiblingTarget(SceneViewController.scene.objects),
      };
    } else {
      // GameObject has a parent
      return {
        newParentId: parentGameObjectData.id,
        siblingTarget: calculateSiblingTarget(parentGameObjectData.children),
      };
    }
  }

  public get description(): string {
    return `Move ${this.gameObjectName} in scene Hierarchy`;
  }
}
