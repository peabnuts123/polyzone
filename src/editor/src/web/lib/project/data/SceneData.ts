import { makeAutoObservable } from "mobx";

import { ISceneData, SceneDataConfiguration, SceneData as SceneDataRuntime } from "@polyzone/runtime/src/cartridge";

import { SceneDefinition, SceneManifest } from "../definition";
import { __loadObjectDefinitionForRuntime } from "./loadObjectDefinition";
import { GameObjectData } from "./GameObjectData";
import { AssetDb } from "./AssetDb";

export class SceneData implements ISceneData {
  private _sceneData: SceneDataRuntime;

  public readonly id: string;
  public hash: string;

  public constructor(sceneDefinition: SceneDefinition, sceneManifest: SceneManifest, assetDb: AssetDb) {
    this._sceneData = new SceneDataRuntime({
      path: sceneManifest.path,
      ...sceneDefinition,
    }, assetDb, __loadObjectDefinitionForRuntime);

    /* Manifest */
    this.id = sceneManifest.id;
    this.hash = sceneManifest.hash;

    makeAutoObservable(this);
    makeAutoObservable(this._sceneData);
  }

  /**
   * Get a GameObject in the scene by ID. If no GameObject exists with this ID, an Error is thrown.
   * The only difference between this and {@link findGameObject} is that this throws an Error if no GameObject is found,
   * whereas {@link findGameObject} returns undefined.
   * @param gameObjectId ID of the GameObject to find.
   * @throws Error if no GameObject exists with the given ID.
   */
  public getGameObject(gameObjectId: string): GameObjectData {
    const result = this.findGameObject(gameObjectId);
    if (result === undefined) {
      throw new Error(`No GameObject exists with ID '${gameObjectId}' in scene '${this.path}' (${this.id})`);
    }
    return result;
  }

  /**
   * Find the parent of a GameObject in the scene by its ID. If the GameObject is a top-level object, this will return undefined.
   * If no GameObject exists with the given ID, an Error will be thrown.
   * @param gameObjectId The ID of the GameObject whose parent is to be found.
   */
  public getGameObjectParent(gameObjectId: string): GameObjectData | undefined {
    for (const object of this.objects) {
      if (object.id === gameObjectId) {
        // Found object as top-level object
        return undefined;
      } else {
        // Look for object as descendent of top-level object's children
        const childResult = object.findGameObjectParentInChildren(gameObjectId);
        if (childResult !== undefined) {
          return childResult;
        }
      }
    }

    throw new Error(`No GameObject exists with ID '${gameObjectId}' in scene '${this.path}' (${this.id})`);
  }

  /**
   * Find a GameObject in the scene by ID.
   * The only difference between this and {@link getGameObject} is that this returns undefined if no GameObject is found,
   * whereas {@link getGameObject} throws an Error.
   * @param gameObjectId ID of the GameObject to find.
   */
  public findGameObject(gameObjectId: string): GameObjectData | undefined {
    for (const object of this.objects) {
      if (object.id === gameObjectId) {
        // Found object as top-level object
        return object;
      } else {
        // Look for object as descendent of top-level object's children
        const childResult = object.findGameObjectInChildren(gameObjectId);
        if (childResult !== undefined) {
          return childResult;
        }
      }
    }
  }

  public get path(): string { return this._sceneData.path; }
  public set path(path: string) { this._sceneData.path = path; }
  public get objects(): GameObjectData[] { return this._sceneData.objects as GameObjectData[]; }
  public set objects(objects: GameObjectData[]) { this._sceneData.objects = objects; }
  public get config(): SceneDataConfiguration { return this._sceneData.config; }
  public set config(config: SceneDataConfiguration) { this._sceneData.config = config; }
}
