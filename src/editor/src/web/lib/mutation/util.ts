import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";

import { MutationPath, resolvePath, ResolvePathSelector } from "@lib/util/JsoncContainer";
import { SceneDefinition } from "@lib/project/definition/scene/SceneDefinition";
import { AssetDefinition, ProjectDefinition } from "@lib/project";

/**
 * Find the path of a GameObject relative to a parent GameObject by recursively searching
 * its children.
 * @param id ID of the GameObject to find.
 * @param parentObject Parent GameObject in which to search.
 */
export function findGameObjectInChildren(id: string, parentObject: GameObjectDefinition): [GameObjectDefinition, MutationPath<GameObjectDefinition>] | undefined {
  if (parentObject.children === undefined) return;

  // Iterate children objects
  for (let i = 0; i < parentObject.children.length; i++) {
    const object = parentObject.children[i];
    const objectPath = resolvePath<GameObjectDefinition, GameObjectDefinition>((parent) => parent.children![i]);
    if (object.id === id) {
      // Found object as child of parent
      return [object, objectPath];
    } else {
      // Look for object as descendent of child
      const childResult = findGameObjectInChildren(id, object);
      if (childResult !== undefined) {
        const [targetObject, childPath] = childResult;
        return [targetObject, objectPath.concat(childPath)];
      }
    }
  }
}

/**
 * Given the ID of a GameObject, find its path in the hierarchy of the scene. Additionally,
 * resolve a path relative to this GameObject and return the entire path to the relative property.
 * Intended for JSONC mutation.
 * @param gameObjectId ID of the GameObject to find
 * @param scene Scene in which to find the GameObject
 * @param pathSelector Path resolver function to select a path relative to the target GameObject.
 * @returns The entire path from the scene root to the property returned by `pathSelector`, for use in JSONC mutation.
 * @example
 * ```typescript
 * const path = resolvePathForSceneObjectMutation(gameObject.id, scene, (gameObject) => gameObject.transform.position);
 * console.log(path); // Prints `["objects", 1, "children", 2, "transform", "position"]
 * ```
 */
export function resolvePathForSceneObjectMutation<TPathTarget>(gameObjectId: string, scene: SceneDefinition, pathSelector: ResolvePathSelector<GameObjectDefinition, TPathTarget>): MutationPath<TPathTarget>;
export function resolvePathForSceneObjectMutation(gameObjectId: string, scene: SceneDefinition): MutationPath<GameObjectDefinition>;
export function resolvePathForSceneObjectMutation<TPathTarget>(gameObjectId: string, scene: SceneDefinition, pathSelector?: ResolvePathSelector<GameObjectDefinition, TPathTarget>): MutationPath<TPathTarget> {
  let target: [GameObjectDefinition, MutationPath<TPathTarget>] | undefined = undefined;

  for (let i = 0; i < scene.objects.length; i++) {
    const object = scene.objects[i];
    const objectPath = resolvePath<SceneDefinition, GameObjectDefinition>((scene) => scene.objects[i]);
    if (object.id === gameObjectId) {
      // Found object as top-level object
      target = [object, objectPath];
      break;
    } else {
      // Look for object as descendent of top-level object
      const childResult = findGameObjectInChildren(gameObjectId, object);
      if (childResult !== undefined) {
        const [targetObject, childPath] = childResult;
        target = [targetObject, objectPath.concat(childPath)];
        break;
      }
    }
  }

  if (target === undefined) {
    throw new Error(`Could not find any object in scene with id: '${gameObjectId}'`);
  }

  // @NOTE No need for the actual game object at this time, but left it in anyways 🤷‍♀️
  const [_, mutationPath] = target;
  let relativePath: MutationPath<TPathTarget> = [];
  if (pathSelector !== undefined) {
    relativePath = resolvePath(pathSelector);
  }


  const result = mutationPath.concat(relativePath);
  console.log(`[resolvePathForSceneObjectMutation] Resolved path: ${pathToString(result)}`);
  return result;
}

export function resolvePathForAssetMutation<TPathTarget>(assetId: string, project: ProjectDefinition, pathSelector: ResolvePathSelector<AssetDefinition, TPathTarget>): MutationPath<TPathTarget>;
export function resolvePathForAssetMutation(assetId: string, project: ProjectDefinition): MutationPath<AssetDefinition>;
export function resolvePathForAssetMutation<TPathTarget>(assetId: string, project: ProjectDefinition, pathSelector?: ResolvePathSelector<AssetDefinition, TPathTarget>): MutationPath<TPathTarget> {
  const assetIndex = project.assets.findIndex(((asset) => asset.id === assetId));

  if (assetIndex === -1) {
    throw new Error(`Could not find any asset in project with id: '${assetId}'`);
  }

  const assetPath = resolvePath<ProjectDefinition, AssetDefinition>((project) => project.assets[assetIndex]);

  let relativePath: MutationPath<TPathTarget> = [];
  if (pathSelector !== undefined) {
    relativePath = resolvePath(pathSelector);
  }


  return assetPath.concat(relativePath);
}

/**
 * Read the real value of a path from a given scene.
 * @param path The path from which to read within the scene.
 * @param scene Scene from which to read the value.
 */
export function readPathInScene<TPathTarget>(path: MutationPath<TPathTarget>, scene: SceneDefinition): TPathTarget {
  let currentValue: any = scene;
  for (const pathSegment of path) {
    currentValue = currentValue[pathSegment as keyof typeof currentValue];
  }
  return currentValue;
}

function pathToString(path: (string | number)[]): string {
  /*
   * Convert numeric segments into [4]
   * Convert string segments into .something
   * e.g. `.foo.bar[4].baz`
   */
  return path.map((x) => typeof (x) === 'number' ? `[${x}]` : `.${x}`).join('');
}
