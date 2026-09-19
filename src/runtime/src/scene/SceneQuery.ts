import { GameObjectComponent as GameObjectComponentCore } from "@polyzone/core/objects/GameObjectComponent";
import {
  SceneQuery as SceneQueryCore,
  GameObjectQuery as GameObjectQueryCore,
  GameObjectComponentQuery as GameObjectComponentQueryCore,
  IQueryResult,
} from '@polyzone/core/scene';
import { GameObject, GameObjectComponent } from "@polyzone/runtime/objects";
import { Scene } from "./Scene";
import { ClassReference } from '@lopoly/engine/util/types';


export class QueryUtils {
  public static getPathSegments(pathString: string): string[] {
    return pathString
      .replace(/(?:^\/+|\/+$)/g, '') // Replace leading and trailing slashes
      .replace(/\/+/g, '/') // Collapse any consecutive slashes into single slashes
      .split('/');
  }

  public static resolvePath(path: string, scene: Scene, initialGameObject: GameObject | undefined): GameObject {
    // Normalize path into segments (don't bother canonicalising)
    const pathSegments = QueryUtils.getPathSegments(path);

    if (pathSegments.length === 0) {
      throw new Error(`Could not resolve empty path: ${path}`);
    }

    /**
     * Stateful iteration property.
     * This will be the result once iteration stops
     */
    let currentGameObject = initialGameObject;
    /**
     * Full stack of segments that have been processed (including the current segment).
     * This is just used for diagnostic messages.
     */
    const processedSegments: string[] = [];

    // Iterate from the initial context, one segment at a time
    for (const segment of pathSegments) {
      processedSegments.push(segment);

      // Look up the heirarchy, i.e. the current state's parent
      if (segment === '..') {
        // const parent = this.getParent(currentNode);
        const parent = currentGameObject?.parent;
        if (parent === undefined) {
          throw new Error(`Could not resolve path: '${processedSegments.join('/')}'. Attempted to resolve parent node '..' from the scene root`);
        } else {
          currentGameObject = parent;
        }
      } else {
        // Find the GameObject with the matching name as the current segment
        let matchingGameObject: GameObject | undefined;
        if (currentGameObject !== undefined) {
          // Look through current game object's children
          matchingGameObject = currentGameObject.findChild((gameObject) => gameObject.name === segment, false);
        } else {
          // No current game object - look through top level objects in scene
          matchingGameObject = scene.topLevelGameObjects.find((gameObject) => gameObject.name === segment);
        }
        if (matchingGameObject === undefined) {
          // Iteration ended since path does not match any GameObjects
          throw new Error(`No object exists at path: '${processedSegments.join('/')}'`);
        }

        // Update iteration state
        currentGameObject = matchingGameObject;
      }
    }

    // Sanity check. Should not be possible (but type system cannot prove it)
    if (currentGameObject === undefined) {
      throw new Error(`Unhandled scenario. resolvePath() returned undefined!`);
    }

    return currentGameObject;
  }
}

export class SceneQuery extends SceneQueryCore {
  private scene: Scene;

  public constructor(scene: Scene) {
    super();
    this.scene = scene;

    // Self-binding to support destructuring `SceneQuery` instances
    this.path = this.path.bind(this);
  }

  public path(pathString: string): GameObjectQuery {
    const gameObject = QueryUtils.resolvePath(pathString, this.scene, undefined);
    return new GameObjectQuery(this.scene, gameObject);
  }
}

export class GameObjectQuery extends GameObjectQueryCore {
  private readonly scene: Scene;
  private readonly gameObject: GameObject;
  public constructor(scene: Scene, gameObject: GameObject) {
    super();
    this.scene = scene;
    this.gameObject = gameObject;

    // Self-binding to support destructuring `GameObjectQuery` instances
    this.path = this.path.bind(this);
    this.component = this.component.bind(this);
  }

  public override path(pathString: string): GameObjectQuery {
    const gameObject = QueryUtils.resolvePath(pathString, this.scene, this.gameObject);
    return new GameObjectQuery(this.scene, gameObject);
  }

  public override component<TGameObjectComponent extends GameObjectComponentCore>(componentCtor: ClassReference<TGameObjectComponent>): GameObjectComponentQuery<TGameObjectComponent> {
    const components = this.gameObject.components.filter(
      (component): component is TGameObjectComponent & GameObjectComponent =>
        component instanceof componentCtor,
    );

    if (components.length === 0) {
      throw new Error(`No component of type '${componentCtor.name}' found on GameObject '${this.gameObject.name}' ($${this.gameObject.id})`);
    } else if (components.length > 1) {
      // @TODO
      throw new Error(`Not yet implemented. '${this.gameObject.name}' ($${this.gameObject.id}) has multiple instances of '${componentCtor.name}' component on it`);
    } else {
      return new GameObjectComponentQuery(components[0]);
    }
  }

  public override get result(): GameObject {
    return this.gameObject;
  }
}

export class GameObjectComponentQuery<TGameObjectComponent extends GameObjectComponentCore> extends GameObjectComponentQueryCore<TGameObjectComponent> implements IQueryResult<TGameObjectComponent> {
  private component: TGameObjectComponent;
  public constructor(component: TGameObjectComponent) {
    super();
    this.component = component;
  }

  public get result(): TGameObjectComponent {
    return this.component;
  }
}
