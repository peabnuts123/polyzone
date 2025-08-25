import { makeAutoObservable } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight as HemisphericLightBabylon } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight as DirectionalLightBabylon } from '@babylonjs/core/Lights/directionalLight';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import "@babylonjs/loaders/OBJ/objFileLoader";
import "@babylonjs/loaders/glTF";

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { MaterialAsset, MaterialDefinition } from '@polyzone/runtime/src/world';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import type { IProjectController } from '@lib/project/ProjectController';
import { MaterialAssetData } from '@lib/project/data';
import { ProjectFileEventType } from '@lib/project/watcher/project';
import { ProjectAssetEventType } from '@lib/project/watcher/assets';
import { MaterialEditorViewMutator, MaterialEditorViewMutatorNew } from '@lib/mutation/MaterialEditor/MaterialEditorView';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import { MaterialData } from './MaterialData';

export interface IMaterialEditorViewController {
  startBabylonView(): () => void;
  destroy(): void;
  reloadSceneData(material?: MaterialAssetData): Promise<void>;

  get canvas(): HTMLCanvasElement;
  get hasLoadedMaterial(): boolean;
  get materialAssetData(): MaterialAssetData;
  get materialData(): MaterialData;
  get materialJson(): JsoncContainer<MaterialDefinition>;
  get materialInstance(): RetroMaterial;
  get mutator(): MaterialEditorViewMutator;
  get mutatorNew(): MaterialEditorViewMutatorNew;
  get scene(): BabylonScene;
}

export class MaterialEditorViewController implements IMaterialEditorViewController {
  private _materialAssetData: MaterialAssetData;
  private _materialData: MaterialData | undefined;
  private _materialJson: JsoncContainer<MaterialDefinition> | undefined;

  private readonly projectController: IProjectController;
  private readonly _mutator: MaterialEditorViewMutator;
  private readonly _mutatorNew: MaterialEditorViewMutatorNew;

  private readonly _canvas: HTMLCanvasElement;
  private readonly engine: Engine;
  private readonly babylonScene: BabylonScene;
  private sceneCamera!: ArcRotateCamera;
  private readonly unlistenToFileSystemEvents: () => void;

  private _materialInstance: RetroMaterial | undefined = undefined;

  private constructor(material: MaterialAssetData, projectController: IProjectController) {
    this._materialAssetData = material;
    this.projectController = projectController;
    this._mutator = new MaterialEditorViewMutator(
      this,
      projectController,
    );
    this._mutatorNew = new MaterialEditorViewMutatorNew(
      this,
      projectController,
    );

    // Load material asset
    void this.loadMaterial();

    // @TODO Consider making this common babylon stuff reusable
    this._canvas = document.createElement('canvas');
    this.canvas.classList.add('w-full', 'h-full');

    // @NOTE `preserveDrawingBuffer` needed to be able to capture canvas contents
    this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: true }, true);
    this.babylonScene = new BabylonScene(this.engine);

    const stopListeningToProjectFileEvents = projectController.filesWatcher.onProjectFileChanged((event) => {
      if (event.type === ProjectFileEventType.Modify) {
        const asset = event.project.assets.getById(this.materialAssetData.id, AssetType.Material);
        if (asset === undefined) {
          // @TODO - close tab or something (gracefully exit)
          throw new Error(`Error while reloading asset due to project file change - no asset with ID '${this.materialAssetData.id}' could be found in new project data`);
        } else {
          void this.reloadSceneData(asset);
        }
      }
    });
    const stopListeningToAssetFileEvents = projectController.filesWatcher.onAssetChanged((event) => {
      switch (event.type) {
        case ProjectAssetEventType.Delete:
          if (event.asset.id === this.materialAssetData.id) {
            // @TODO Close tab or something
            console.error(`[${MaterialEditorViewController.name}] (onAssetChanged) Material asset was deleted. Should close tab: ${this.materialAssetData.path}`);
            return;
          }
        // @NOTE Fall-through
        case ProjectAssetEventType.Modify: {
          // Collect all assets that are dependent on the asset that updated
          const allAffectedAssets: string[] = [
            event.asset.id,
            ...event.assetDependents,
          ];

          // Reload the scene if the material is dependent on one of the assets that changed
          if (allAffectedAssets.includes(this.materialAssetData.id)) {
            console.log(`[${MaterialEditorViewController.name}] (onAssetChanged) Reloading scene due to asset change: (assetId='${event.asset.id}')`);
            void this.reloadSceneData();
          }
          break;
        }
        case ProjectAssetEventType.Create:
        case ProjectAssetEventType.Rename:
          break;
        default:
          console.error(`[${MaterialEditorViewController.name}] (onAssetChanged) Unimplemented asset event: `, event);
      }
    });

    this.unlistenToFileSystemEvents = () => {
      stopListeningToProjectFileEvents();
      stopListeningToAssetFileEvents();
    };

    makeAutoObservable(this);
  }

  public static async create(material: MaterialAssetData, projectController: IProjectController): Promise<MaterialEditorViewController> {
    const controller = new MaterialEditorViewController(material, projectController);
    await controller.buildScene();
    return controller;
  }

  private async loadMaterial(): Promise<void> {
    const materialAssetFile = await this.projectController.fileSystem.readFile(this.materialAssetData.path);
    this._materialJson = new JsoncContainer(materialAssetFile.textContent);
    const materialData = this._materialData = MaterialData.fromDefinition(this._materialJson.value, this.projectController.project.assets);

    // Since we've already loaded the data - might as well proactively populate the asset cache
    this.projectController.assetCache.set(this.materialAssetData.id, (context) => MaterialAsset.fromMaterialData(materialData, this._materialAssetData, context));
  }

  private async buildScene(): Promise<void> {
    const camera = this.sceneCamera = new ArcRotateCamera("main", -Math.PI * 3 / 4, Math.PI * 2 / 6, 5, Vector3Babylon.Zero(), this.babylonScene);
    camera.attachControl(this.canvas, true);
    camera.minZ = 0.1;

    /* Scene clear color */
    this.babylonScene.clearColor = Color3Babylon.Black().toColor4();

    /* Set up global ambient lighting */
    // @TODO Ambient lighting through shader
    const ambientLight = new HemisphericLightBabylon("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    ambientLight.intensity = 0.3;
    ambientLight.diffuse = Color3Babylon.White();
    ambientLight.groundColor = Color3Babylon.White();
    ambientLight.specular = Color3Babylon.Black();
    const sun = new DirectionalLightBabylon("sun", new Vector3Babylon(-0.5, -1, 0.75), this.babylonScene);
    sun.diffuse = Color3Babylon.White();
    sun.intensity = 0.7;

    /* @NOTE WASD */
    camera.keysUp.push(87);
    camera.keysLeft.push(65);
    camera.keysRight.push(68);
    camera.keysDown.push(83);

    await this.createScene();

    await this.babylonScene.whenReadyAsync();
  }

  public startBabylonView(): () => void {
    void this.reloadSceneData();

    // @TODO Is view active stuff? Like in SceneViewController?

    const renderLoop = (): void => {
      this.babylonScene.render();
    };
    this.engine.runRenderLoop(renderLoop);

    const resizeObserver = new ResizeObserver((entries) => {
      const newSize = entries[0].contentRect;
      this.engine.setSize(newSize.width * devicePixelRatio, newSize.height * devicePixelRatio, true);
    });
    resizeObserver.observe(this.canvas as unknown as Element); // @TODO FUCK YOU REACT!!!!!!

    /* Teardown - when scene view is unloaded */
    const onDestroyView = (): void => {
      resizeObserver.unobserve(this.canvas as unknown as Element); // @TODO FUCK YOU REACT!!!!!!
      this.engine.stopRenderLoop(renderLoop);
    };
    return onDestroyView;
  }

  public destroy(): void {
    this.materialInstance?.dispose();
    this.babylonScene.onPointerObservable.clear();
    this.babylonScene.dispose();
    this.engine.dispose();
    this.unlistenToFileSystemEvents();
    this._canvas.remove();
  }

  private async createScene(): Promise<void> {
    const material = this._materialInstance = new RetroMaterial('preview', this.babylonScene);
    const materialAsset = await this.projectController.assetCache.loadAsset(this.materialAssetData, this.babylonScene);
    material.readOverridesFromMaterial(materialAsset);

    const box = MeshBuilder.CreateBox("__previewObject", { size: 1 }, this.babylonScene);
    box.material = material;
  }

  public async reloadSceneData(material?: MaterialAssetData): Promise<void> {
    // Clear out the scene
    this.materialInstance?.dispose();

    // Update data
    if (material !== undefined) {
      this._materialAssetData = material;
    }

    await this.createScene();
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public get hasLoadedMaterial(): boolean {
    return this._materialData !== undefined;
  }

  public get materialAssetData(): MaterialAssetData {
    return this._materialAssetData;
  }

  public get materialData(): MaterialData {
    if (this._materialData === undefined) {
      throw new Error(`Material has not loaded yet`);
    }
    return this._materialData;
  }

  public get materialJson(): JsoncContainer<MaterialDefinition> {
    if (this._materialJson === undefined) {
      throw new Error(`Material has not loaded yet`);
    }
    return this._materialJson;
  }

  public get materialInstance(): RetroMaterial {
    if (this._materialInstance === undefined) {
      throw new Error(`Material instance has not been created yet`);
    }
    return this._materialInstance;
  }

  public get mutator(): MaterialEditorViewMutator {
    return this._mutator;
  }
  public get mutatorNew(): MaterialEditorViewMutatorNew {
    return this._mutatorNew;
  }

  public get scene(): BabylonScene {
    return this.babylonScene;
  }
}
