import { fetchCartridge, loadCartridge, readCartridgeArchive } from "./cartridge";
import { Game } from "./Game";
import { Engine } from "@lopoly/engine";
import { Context } from "@polyzone/core/Context";
import { Input } from "./input";
import { CartridgeFileSystem } from "./filesystem";

export type OnUpdateCallback = (dt: number, time: number) => void;

export class Runtime {
  private canvas: HTMLCanvasElement;
  private onUpdateHooks: OnUpdateCallback[];

  // State
  private game: Game | undefined;

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.onUpdateHooks = [];
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
    let cartridgeFileSystem: CartridgeFileSystem;
    if (source instanceof Uint8Array) {
      cartridgeFileSystem = await readCartridgeArchive(source);
    } else {
      cartridgeFileSystem = await fetchCartridge(source);
    }

    // Parse cartridge archive
    const cartridge = loadCartridge(cartridgeFileSystem);
    console.log(`[${Runtime.name}] (${this.loadCartridge.name}) Loaded cartridge in ${Math.trunc(performance.now() - timerStart)}ms: ${cartridge.assetDb.assets.length} assets, ${cartridge.sceneDb.allScenes.length} scenes.`);

    const engine = new Engine(this.canvas, cartridgeFileSystem);

    Input.configureDefaultBindings(engine.inputSystem);

    this.game = new Game(cartridge, engine);

    Context.bindEngine({
      consumeFrameBudget(_budget) {
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
    await this.game.boot((dt, time) => {
      // Fire onUpdate hooks
      for (const onUpdate of this.onUpdateHooks) {
        onUpdate(dt, time);
      }
    });
    console.log(`[${Runtime.name}] (${this.run.name}) Loaded game in ${Math.trunc(performance.now() - timerStart)}ms`);
  }

  public onUpdate(callback: OnUpdateCallback): void {
    this.onUpdateHooks.push(callback);
  }
}
