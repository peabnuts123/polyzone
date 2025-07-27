import type { Scene as BabylonScene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

import { World } from '@polyzone/core/src/modules/World';

import { ScriptLoader } from './ScriptLoader';
import {
  Cartridge,
  SceneData as CartridgeScene,
  GameObjectData,
  AssetType,
} from './cartridge';
import {
  GameObject,
  Transform,
  WorldState,
} from './world';
import Modules from './modules';
import { toColor3Babylon } from "./util";
import { AssetCache } from "./world/assets/AssetCache";
import { RetroMaterial } from "./materials/RetroMaterial";
import { createGameObject, createGameObjectComponent } from "./world/createGameObject";

/**
 * Top-level system containing the entire game and all content
 * including the world, the cartridge, and all systems.
 */
export class Game {
  private cartridge: Cartridge | undefined;
  private babylonScene: BabylonScene;
  private worldState: WorldState;
  private _assetCache: AssetCache | undefined;
  private scriptLoader: ScriptLoader;
  private ambientLight: HemisphericLight | undefined;

  constructor(babylonScene: BabylonScene) {
    this.babylonScene = babylonScene;
    this.worldState = {};
    this.scriptLoader = new ScriptLoader();

    Modules.onInit();
  }

  public onUpdate(deltaTime: number): void {
    Modules.onUpdate(deltaTime);
  }

  public dispose(): void {
    Modules.dispose();
  }

  /**
   * Plug a cartridge into the console and press the power button.
   * @param cartridge The cartridge to load
   */
  public async loadCartridge(cartridge: Cartridge): Promise<void> {
    // @TODO unload previous cartridge
    this.cartridge = cartridge;
    this._assetCache = new AssetCache(cartridge.assetDb);

    // @DEBUG Just for fun right now
    RetroMaterial.DEBUG_DITHERING_ENABLED = true;

    // Load all scripts from the cartridge
    // We do this proactively because scripts can depend on other scripts
    // which need to be injected when they are requested
    await Promise.all(cartridge.assetDb.assets
      .filter((asset) => asset.type === AssetType.Script)
      .map((asset) =>
        cartridge.assetDb.loadAsset(asset)
          .then((file) => {
            this.scriptLoader.loadModule(asset, file);
          }),
      ));


    // Load the first scene on the cartridge
    // @TODO add concept of "initial" scene to cartridge manifest
    await this.loadCartridgeScene(cartridge.sceneDb.allScenes[0]);
  }

  /**
   * Load a cartridge scene, unloading the current one.
   * @param scene The scene to load
   */
  public async loadCartridgeScene(scene: CartridgeScene): Promise<void> {
    // @TODO unload previous scene
    this.ambientLight?.dispose();

    // @TODO I guess we need a runtime object for a Scene (rather than storing it on Game)
    /* Scene clear color */
    this.babylonScene.clearColor = toColor3Babylon(scene.config.clearColor).toColor4();

    /* Set up global ambient lighting */
    this.ambientLight = new HemisphericLight("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    this.ambientLight.intensity = scene.config.lighting.ambient.intensity;
    this.ambientLight.diffuse = toColor3Babylon(scene.config.lighting.ambient.color);
    this.ambientLight.groundColor = toColor3Babylon(scene.config.lighting.ambient.color);
    this.ambientLight.specular = Color3.Black();

    /* Load game objects */
    for (const sceneObject of scene.objects) {
      const gameObject = await this.createGameObject(sceneObject);
      World.addObject(gameObject);
    }

    // Call init() on all game objects
    // @NOTE Special case. init() is only called after ALL
    // GameObjects have been loaded, as opposed to immediately after adding
    // each object to the scene
    for (const gameObject of World.gameObjects) {
      gameObject.init();
    }
  }

  private async createGameObject(gameObjectData: GameObjectData, parentTransform: Transform | undefined = undefined): Promise<GameObject> {
    return createGameObject(
      gameObjectData,
      parentTransform,
      this.babylonScene,
      (gameObject, componentData) =>
        createGameObjectComponent(
          gameObject,
          componentData,
          this.babylonScene,
          this.assetCache,
          this.scriptLoader,
        ),
    );
  }

  private get assetCache(): AssetCache {
    if (this._assetCache === undefined) {
      throw new Error(`AssetCache has not been initialised yet - no cartridge loaded`);
    }
    return this._assetCache;
  }
}
