import { makeAutoObservable } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight as HemisphericLightBabylon } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight as DirectionalLightBabylon } from '@babylonjs/core/Lights/directionalLight';
import { Color3 as Color3Babylon, Color4 as Color4Babylon } from '@babylonjs/core/Maths/math.color';
import { v4 as uuid } from 'uuid';
import "@babylonjs/loaders/OBJ/objFileLoader";
import "@babylonjs/loaders/glTF";

import { Vector3 } from '@polyzone/core/src/util/Vector3';
import { AssetType, TransformData } from '@polyzone/runtime/src/cartridge';
import { AssetCache, GameObject, MeshComponent, Transform } from '@polyzone/runtime/src/world';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { ProjectController } from '@lib/project/ProjectController';
import { MeshAssetData } from '@lib/project/data';
import { ProjectFileEventType } from '@lib/project/watcher/project';
import { ProjectAssetEventType } from '@lib/project/watcher/assets';
import { ModelMaterialMutator } from '@lib/mutation/asset/ModelMaterialMutator';

// @NOTE Pretty similar to SceneViewController.ts
export class ModelMaterialEditorController {
  private _model: MeshAssetData;
  private readonly projectController: ProjectController;
  private readonly _mutator: ModelMaterialMutator;

  private readonly _canvas: HTMLCanvasElement;
  private readonly engine: Engine;
  private readonly babylonScene: BabylonScene;
  private sceneCamera!: ArcRotateCamera;
  private readonly assetCache: AssetCache;
  private readonly unlistenToFileSystemEvents: () => void;

  private previewGameObject: GameObject | undefined;
  private materialInstances: RetroMaterial[] | undefined = undefined;

  private _selectedMaterialName: string | undefined = undefined;

  public constructor(model: MeshAssetData, projectController: ProjectController) {
    this._model = model;
    this.projectController = projectController;
    this.assetCache = new AssetCache();
    this._mutator = new ModelMaterialMutator(
      this,
      projectController,
    );

    this._canvas = document.createElement('canvas');
    this.canvas.classList.add('w-full', 'h-full');

    this.engine = new Engine(this.canvas, true, {}, true);
    this.babylonScene = new BabylonScene(this.engine);

    // Build scene
    void this.buildScene();

    const stopListeningToProjectFileEvents = projectController.filesWatcher.onProjectFileChanged((event) => {
      if (event.type === ProjectFileEventType.Modify) {
        const asset = event.project.assets.getById(this.model.id, AssetType.Mesh);
        if (asset === undefined) {
          // @TODO - close tab or something (gracefully exit)
          throw new Error(`Error while reloading asset due to project file change - no asset with ID '${this.model.id}' could be found in new project data`);
        } else {
          void this.reloadSceneData(asset);
        }
      }
    });
    const stopListeningToAssetFileEvents = projectController.filesWatcher.onAssetChanged((event) => {
      // Ignore events for other assets
      if (event.asset.id !== this.model.id) return;

      if (event.type === ProjectAssetEventType.Modify) {
        void this.reloadSceneData(event.asset as MeshAssetData);
      } else if (event.type === ProjectAssetEventType.Delete) {
        // @TODO close scene tab
      }
    });

    this.unlistenToFileSystemEvents = () => {
      stopListeningToProjectFileEvents();
      stopListeningToAssetFileEvents();
    };

    makeAutoObservable(this);
  }

  private async buildScene(): Promise<void> {
    const camera = this.sceneCamera = new ArcRotateCamera("main", -Math.PI * 3 / 4, Math.PI * 2 / 6, 5, Vector3Babylon.Zero(), this.babylonScene);
    camera.attachControl(this.canvas, true);
    camera.minZ = 0.1;

    /* @NOTE WASD */
    camera.keysUp.push(87);
    camera.keysLeft.push(65);
    camera.keysRight.push(68);
    camera.keysDown.push(83);

    await this.createScene();

    await this.babylonScene.whenReadyAsync();
  }

  public startBabylonView(): () => void {
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
    this.previewGameObject?.destroy();
    this.babylonScene.onPointerObservable.clear();
    this.babylonScene.dispose();
    this.engine.dispose();
    this.unlistenToFileSystemEvents();
    this._canvas.remove();
  }

  private async createScene(): Promise<void> {
    /* Scene clear color */
    this.babylonScene.clearColor = Color3Babylon.Black().toColor4();

    /* Set up global ambient lighting */
    const ambientLight = new HemisphericLightBabylon("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    ambientLight.intensity = 0.3;
    const sun = new DirectionalLightBabylon("sun", new Vector3Babylon(0, -1, 1), this.babylonScene);
    sun.diffuse = Color3Babylon.White();
    ambientLight.diffuse = Color3Babylon.White();
    ambientLight.groundColor = Color3Babylon.White();
    ambientLight.specular = Color3Babylon.Black();

    /* Construct a game object to host the mesh for previewing */
    // @TODO Third copy of this logic... re-use from SceneViewController / Game.ts ?
    const gameObjectName = '__preview';
    const transform = new Transform(
      gameObjectName,
      this.babylonScene!,
      undefined,
      new TransformData(Vector3.zero(), Vector3.zero(), Vector3.one()),
    );
    const gameObject = this.previewGameObject = new GameObject(
      uuid(),
      gameObjectName,
      transform,
    );
    transform.gameObject = gameObject;

    // Add mesh component to preview game object
    const meshAsset = await this.assetCache.loadAsset(this.model, this.babylonScene);
    const meshComponent = new MeshComponent(uuid(), gameObject, meshAsset);
    gameObject.addComponent(meshComponent);

    // Read materials from preview mesh (e.g. for list view)
    this.materialInstances = meshAsset.assetContainer.materials.map((material) => {
      // @NOTE Sanity check that materials are all the expected type
      if (material instanceof RetroMaterial) {
        return material;
      } else {
        console.error(`Found non-RetroMaterial instance in mesh asset: `, material);
        throw new Error(`Found non-RetroMaterial instance in mesh asset`);
      }
    });
  }

  private async reloadSceneData(model: MeshAssetData): Promise<void> {
    // Clear out the scene
    this.previewGameObject?.destroy();

    const rootNodes = [...this.babylonScene.rootNodes];
    for (const sceneObject of rootNodes) {
      if (sceneObject !== this.sceneCamera) {
        sceneObject.dispose(false, true);
      }
    }

    // Update data
    this._model = model;

    await this.createScene();
  }

  public getMaterialByName(materialName: string): RetroMaterial {
    const material = this.materialInstances?.find((material) => material.name === materialName);
    if (!material) {
      throw new Error(`Cannot get material, no material exists on ModelMaterialEditorController with name '${materialName}'`);
    }
    return material;
  }

  public selectMaterial(materialName: string): void {
    this._selectedMaterialName = materialName;
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public get model(): MeshAssetData {
    return this._model;
  }

  public get mutator(): ModelMaterialMutator {
    return this._mutator;
  }

  public get allMaterials(): RetroMaterial[] | undefined {
    return this.materialInstances;
  }

  public get selectedMaterialName(): string | undefined {
    return this._selectedMaterialName;
  }
}
