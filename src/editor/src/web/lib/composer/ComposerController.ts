import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { AssetType, CartridgeArchiveManifest } from '@polyzone/runtime/src/cartridge';

import type { IProjectController } from '@lib/project/ProjectController';
import { toRuntimeSceneDefinition } from '@lib/project/definition';
import { SceneData } from '@lib/project/data';
import { invoke } from '@lib/util/TauriCommands';
import { SceneViewController, type ISceneViewController } from './scene/SceneViewController';


export interface TabData {
  id: string;
  sceneViewController?: ISceneViewController;
}


export interface IComposerController {
  onEnter(): void;
  onExit(): void;
  loadSceneForTab(tabId: string, sceneManifest: SceneData): Promise<void>;
  openNewTab(): TabData;
  closeTab(tabId: string): void;
  onDestroy(): void;
  debug_buildCartridge(entryPointSceneIdOverride?: string): Promise<Uint8Array>;
  get currentlyOpenTabs(): TabData[];
}

export class ComposerController implements IComposerController {
  private _tabData: TabData[] = [];

  private readonly projectController: IProjectController;

  public constructor(projectController: IProjectController) {
    this.projectController = projectController;

    // Open 1 blank tab
    this.openNewTab();

    makeAutoObservable(this);
  }

  public onEnter(): void {
    for (const tab of this.currentlyOpenTabs) {
      if (tab.sceneViewController) {
        const sceneDbRecord = this.projectController.project.scenes.getById(tab.sceneViewController.scene.id);
        if (sceneDbRecord === undefined) {
          throw new Error(`Error reloading scene - could not find scene with id '${tab.sceneViewController.scene.id}' in SceneDb`);
        }

        console.log(`[ComposerController] (onEnter) Reloading active scene: ${sceneDbRecord.data.path}`);
        void tab.sceneViewController.reloadSceneData(sceneDbRecord);
      }
    }
  }

  public onExit(): void {
    /* No-op */
  }

  public async loadSceneForTab(tabId: string, sceneManifest: SceneData): Promise<void> {
    for (const tab of this.currentlyOpenTabs) {
      if (tab.id === tabId) {
        // Look up scene data
        const scene = this.projectController.project.scenes.getByPath(sceneManifest.path);
        if (scene === undefined) throw new Error(`Could not load scene for tab - no scene exists with path '${sceneManifest.path}'`);

        // Unload possible previously-loaded scene
        if (tab.sceneViewController !== undefined) {
          tab.sceneViewController.destroy();
        }

        const sceneViewController = new SceneViewController(
          scene.data,
          scene.jsonc,
          this.projectController,
        );

        runInAction(() => {
          tab.sceneViewController = sceneViewController;
        });
        return;
      }
    }

    throw new Error(`Could not load scene for tab - no tab exists with ID '${tabId}'`);
  }

  public openNewTab(): TabData {
    const newTabData: TabData = {
      id: uuid(),
    };

    runInAction(() => {
      this.currentlyOpenTabs.push(newTabData);
    });

    return newTabData;
  }

  public closeTab(tabId: string): void {
    const tabIndex = this.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) {
      throw new Error(`Could not close tab - no tab exists with ID '${tabId}'`);
    }

    // Unload scene
    this.currentlyOpenTabs[tabIndex].sceneViewController?.destroy();

    runInAction(() => {
      this.currentlyOpenTabs.splice(tabIndex, 1);
    });
  }

  /** Called when the app is unloaded (e.g. page refresh) */
  public onDestroy(): void {
    // Destroy all scene view controllers
    for (const tab of this.currentlyOpenTabs) {
      tab.sceneViewController?.destroy();
    }
  }

  // Kind of a debug method with a bit of a mashup of concerns
  /*
    @TODO
    Is there a way we can do this from Rust, so that we
    could do this from a CLI?
  */
  public async debug_buildCartridge(entryPointSceneIdOverride: string | undefined = undefined): Promise<Uint8Array> {

    // Load scene definitions
    const scenes = this.projectController.project.scenes.getAll();

    // Move `overrideEntryPoint` to be the first scene in the list
    if (entryPointSceneIdOverride !== undefined) {
      const overrideIndex = scenes.findIndex((scene) => scene.manifest.id === entryPointSceneIdOverride);
      if (overrideIndex === -1) {
        throw new Error(`Cannot build cartridge. Cannot set entrypoint to SceneDefinition with ID '${entryPointSceneIdOverride}' - it isn't one of the current project's scenes`);
      }

      const override = scenes.splice(overrideIndex, 1)[0];
      scenes.unshift(override);
    }

    // Build cartridge manifest
    const manifest: CartridgeArchiveManifest = {
      assets: this.projectController.project.assets.getAll()
        .map((asset) => {
          const assetDefinition = asset.toAssetDefinition();

          // @NOTE map assets to pluck only desired properties
          if (asset.type === AssetType.Script) {
            // @NOTE Scripts need to be renamed to .js
            assetDefinition.path = asset.path.replace(/\.\w+$/, '.js');
          }

          return assetDefinition;
        }),
      scenes: scenes.map((scene) =>
        toRuntimeSceneDefinition(scene.jsonc.value, scene.manifest.path),
      ),
    };

    // Compile cartridge file
    const createCartridgeResult = await invoke('create_cartridge', {
      manifestFileBytes: JSON.stringify(manifest),
      projectRootPath: this.projectController.project.rootPath,
      assetPaths: this.projectController.project.assets.getAll()
        .filter((asset) => asset.type !== AssetType.Script)
        .map((asset) => asset.path),
      scriptPaths: this.projectController.project.assets.getAll()
        .filter((asset) => asset.type === AssetType.Script)
        .map((asset) => asset.path),
    });

    return new Uint8Array(createCartridgeResult);
  }

  public get currentlyOpenTabs(): TabData[] {
    return this._tabData;
  }
}
