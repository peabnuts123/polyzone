import { IEngine, Scene as LoPolyScene } from "@lopoly/engine";
import { IQueryResult, Scene as SceneCore } from '@polyzone/core/scene';
import { QueryFn } from "@polyzone/core/scene";
import { GameObjectData, SceneData } from "@polyzone/runtime/cartridge/data";
import { createGameObject, createGameObjectComponent } from "@polyzone/runtime/objects/createGameObject";
import { GameObject } from "@polyzone/runtime/objects/GameObject";
import { AssetCache } from "@polyzone/runtime/assets";
import { ScriptLoader } from "@polyzone/runtime/ScriptLoader";
import { GameObjectQuery, SceneQuery } from "./SceneQuery";

export class Scene extends SceneCore {
  // Config
  public readonly path: string;

  // References
  public readonly lopolyScene: LoPolyScene;
  private readonly assetCache: AssetCache;
  private readonly scriptLoader: ScriptLoader;

  // State
  private _topLevelGameObjects: GameObject[];

  public constructor(data: SceneData, engine: IEngine, assetCache: AssetCache, scriptLoader: ScriptLoader) {
    super();
    this.path = data.path;
    this.assetCache = assetCache;
    this.scriptLoader = scriptLoader;
    this._topLevelGameObjects = [];

    // LoPoly scene
    this.lopolyScene = new LoPolyScene(engine);
    // Lighting
    // @TODO This is just a hack for old cart compat
    this.lopolyScene.lighting.ambientColor = data.config.lighting.ambient.color.scaleSelf(data.config.lighting.ambient.intensity);
  }

  public init(): void {
    this.topLevelGameObjects.forEach((gameObject) => gameObject.init());
  }

  public onUpdate(deltaTime: number, time: number): void {
    this.topLevelGameObjects.forEach((gameObject) => gameObject.onUpdate(deltaTime, time));
  }

  public destroy(): void {
    this.topLevelGameObjects.forEach((gameObject) => gameObject.destroy());
  }

  public override query<TResult>(queryFn: QueryFn<SceneQuery, TResult>): TResult;
  public override query<TResult>(relativeTo: GameObject, queryFn: QueryFn<GameObjectQuery, TResult>): TResult;
  public query<TResult>(relativeToOrQueryFn: GameObject | QueryFn<SceneQuery, TResult>, maybeQueryFn?: QueryFn<GameObjectQuery, TResult>): TResult {
    let result: IQueryResult<TResult>;
    if (relativeToOrQueryFn instanceof GameObject) {
      // Relative query to a game object
      const relativeTo = relativeToOrQueryFn;
      const queryFn = maybeQueryFn!;
      result = queryFn(new GameObjectQuery(this, relativeTo));
    } else {
      // Absolute query relative to world
      const queryFn = relativeToOrQueryFn;
      result = queryFn(new SceneQuery(this));
    }

    return result.result;
  }

  public destroyGameObject(gameObject: GameObject): void {
    if (gameObject.parent !== undefined) {
      // Remove object from parent's children
      gameObject.parent = undefined;
    } else {
      // Remove object from scene
      const index = this.topLevelGameObjects.indexOf(gameObject);
      if (index === -1) {
        throw new Error(`Error trying to destroy ${GameObject.name} with no parent - it is not present in the collection of top-level game objects. Does this ${GameObject.name} belong to this scene?`);
      }
      this._topLevelGameObjects.splice(index, 1);
    }

    gameObject.onDestroy();
  }

  public async createGameObject(gameObjectData: GameObjectData, parentGameObject: GameObject | undefined = undefined): Promise<GameObject> {
    const gameObject = await createGameObject(
      gameObjectData,
      parentGameObject,
      this,
      (componentData, gameObject) =>
        createGameObjectComponent(
          componentData,
          gameObject,
          this,
          this.assetCache,
          this.scriptLoader,
        ),
    );
    this._topLevelGameObjects.push(gameObject);
    return gameObject;
  }

  public get topLevelGameObjects(): readonly GameObject[] { return this._topLevelGameObjects; }
}
