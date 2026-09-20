import { IEngine } from "@lopoly/engine";
import { Cartridge } from "./cartridge/Cartridge";
import { AssetCache } from "./assets/AssetCache";
import { ScriptLoader } from "./ScriptLoader";
import { AssetType } from "./cartridge/archive/assets";
import { SceneData } from "./cartridge/data/scenes";
import { Scene } from "./scene";
import { OnUpdateCallback } from "./Runtime";

export class Game {
  // References
  private readonly engine: IEngine;
  private readonly cartridge: Cartridge;
  private readonly assetCache: AssetCache;
  private readonly scriptLoader: ScriptLoader;

  // State
  private currentScene: Scene | undefined;

  public constructor(cartridge: Cartridge, engine: IEngine) {
    this.cartridge = cartridge;
    this.engine = engine;
    this.assetCache = new AssetCache(engine, cartridge.assetDb);
    this.scriptLoader = new ScriptLoader();
  }

  public async boot(onUpdate?: OnUpdateCallback): Promise<void> {
    // Load all scripts from the cartridge
    // We do this proactively because scripts can depend on other scripts
    // which need to be injected when they are requested
    await Promise.all(this.cartridge.assetDb.assets
      .filter((asset) => asset.type === AssetType.Script)
      .map((asset) =>
        this.cartridge.assetDb.loadAsset(asset)
          .then((file) => {
            this.scriptLoader.loadModule(asset, file);
          }),
      ));


    // @TODO logic for determining which scene to boot
    const bootScene = this.cartridge.sceneDb.allScenes[0];
    await this.loadScene(bootScene);

    this.engine.run((dt, time, stop) => {
      this.onUpdate(dt, time, stop);
      onUpdate?.(dt, time);
    });
  }

  private async loadScene(cartridgeScene: SceneData): Promise<void> {
    if (this.currentScene !== undefined) {
      this.currentScene.destroy();
      // @TODO
      throw new Error(`Changing scenes is unimplemented`);
    }

    const scene = new Scene(cartridgeScene, this.engine, this.assetCache, this.scriptLoader);


    // Create game objects
    await Promise.all(
      cartridgeScene.objects.map((sceneObjectData) =>
        scene.createGameObject(sceneObjectData),
      ),
    );

    // Initialise game objects
    // @NOTE Special case. init() is only called after ALL GameObjects have been
    // loaded, as opposed to immediately after adding each object to the scene
    scene.init();

    this.currentScene = scene;
  }

  private onUpdate(dt: number, time: number, _stop: () => void): void {
    if (this.currentScene !== undefined) {
      this.currentScene.onUpdate(dt, time);
    }
  }

  private onDispose(): void {
    /* @TODO
      - Is this needed at all? Who calls it? What about `stop()` in onUpdate()? Will that call this?
     */
    if (this.currentScene !== undefined) {
      this.currentScene.destroy();
    }
  }
}
