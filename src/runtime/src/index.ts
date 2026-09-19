import { IFileSystem } from "@lopoly/engine/filesystem";
import { Cartridge, fetchCartridge, loadCartridge, readCartridgeArchive } from "./cartridge";
import { CartridgeArchive } from "./cartridge/archive";
import { Game } from "./Game";
import { Engine } from "@lopoly/engine";
import { Context } from "@polyzone/core/Context";
import { Input } from "./input";

export type OnUpdateCallback = () => void;
export type OnDisposeCallback = () => void;

// @TODO move into `Runtime.ts`
export class Runtime {
  private canvas: HTMLCanvasElement;

  // State
  private game: Game | undefined;

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Insert a cartridge into the console.
   * @param cartridgeBytes Binary data of the cartridge.
   */
  public async loadCartridge(cartridgeBytes: Uint8Array): Promise<void>;
  /**
   * Insert a cartridge into the console.
   * @param url URL from where to fetch the cartridge.
   */
  public async loadCartridge(url: string): Promise<void>;
  public async loadCartridge(source: Uint8Array | string): Promise<void>;
  public async loadCartridge(source: Uint8Array | string): Promise<void> {
    const timerStart = performance.now();

    // Fetch and read cartridge archive raw data
    let cartridgeArchive: CartridgeArchive;
    if (source instanceof Uint8Array) {
      cartridgeArchive = await readCartridgeArchive(source);
    } else {
      cartridgeArchive = await fetchCartridge(source);
    }

    // Parse cartridge archive
    const cartridge = loadCartridge(cartridgeArchive);
    console.log(`[${Runtime.name}] (${this.loadCartridge.name}) Loaded cartridge in ${Math.trunc(performance.now() - timerStart)}ms: ${cartridge.assetDb.assets.length} assets, ${cartridge.sceneDb.allScenes.length} scenes.`);

    const engine = new Engine(this.canvas, cartridgeArchive.fileSystem);

    Input.configureDefaultBindings(engine.inputSystem);

    this.game = new Game(cartridge, engine);

    Context.bindEngine({
      consumeFrameBudget(budget) {
        // @TODO - Feel like this should be owned by some kind of 'Constraints' module or something
        // console.log(`[DEBUG] (consumeFrameBudget) Consumed budget: ${budget}`);
      },
    });
  }

  public async run(): Promise<void> {
    if (this.game === undefined) {
      throw new Error(`Cannot run. No cartridge is loaded.`);
    }

    // Boot game
    // *blows on cartridge*
    const timerStart = performance.now();
    await this.game.boot();
    console.log(`[${Runtime.name}] (${this.run.name}) Loaded game in ${Math.trunc(performance.now() - timerStart)}ms`);
  }

  public onUpdate(callback: OnUpdateCallback): void {
  }

  public dispose(): void {
  }
}
