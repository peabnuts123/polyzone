import { makeAutoObservable, runInAction } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight as HemisphericLightBabylon } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight as DirectionalLightBabylon } from '@babylonjs/core/Lights/directionalLight';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { v4 as uuid } from 'uuid';
import "@babylonjs/loaders/OBJ/objFileLoader";
import "@babylonjs/loaders/glTF";

import { Vector3 } from '@polyzone/core/src/util/Vector3';
import { AssetType } from '@polyzone/runtime/src/cartridge';
import { GameObject, Transform } from '@polyzone/runtime/src/world';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';
import {
  GameObject as GameObjectRuntime,
} from '@polyzone/runtime/src/world';

import type { IProjectController } from '@lib/project/ProjectController';
import { GameObjectData, MeshAssetData, MeshComponentData, TransformData } from '@lib/project/data';
import { ProjectFileEventType } from '@lib/project/watcher/project';
import { ProjectAssetEventType } from '@lib/project/watcher/assets';
import { ModelEditorViewMutator, ModelEditorViewMutatorNew } from '@lib/mutation/MaterialEditor/ModelEditorView';
import { ComponentDependencyManager } from '@lib/common/ComponentDependencyManager';
import { MeshComponent } from '@lib/composer/scene/components';
import { MutationController } from '@lib/mutation/MutationController';
import { toVector3Babylon } from '@polyzone/runtime/src/util';

export interface IModelEditorViewController {
  startBabylonView(): () => void;
  destroy(): void;
  reloadSceneData(model?: MeshAssetData): Promise<void>;
  getMaterialByName(materialName: string): RetroMaterial;
  selectMaterial(materialName: string): void;
  focusModel(): void;

  get canvas(): HTMLCanvasElement;
  get model(): MeshAssetData;
  get mutator(): ModelEditorViewMutator;
  get mutatorNew(): ModelEditorViewMutatorNew;
  get allMaterials(): RetroMaterial[] | undefined;
  get selectedMaterialName(): string | undefined;
  get scene(): BabylonScene;
}

// @NOTE Pretty similar to SceneViewController.ts
export class ModelEditorViewController implements IModelEditorViewController {
  private _model: MeshAssetData;
  private readonly projectController: IProjectController;
  private readonly mutationController: MutationController;
  private readonly _mutator: ModelEditorViewMutator;
  private readonly _mutatorNew: ModelEditorViewMutatorNew;

  private readonly _canvas: HTMLCanvasElement;
  private readonly engine: Engine;
  private readonly babylonScene: BabylonScene;
  private sceneCamera!: ArcRotateCamera;
  private readonly componentDependencyManager: ComponentDependencyManager;
  private readonly unlistenToFileSystemEvents: () => void;

  private previewGameObject: GameObject | undefined;
  private materialInstances: RetroMaterial[] | undefined = undefined;

  private _selectedMaterialName: string | undefined = undefined;

  private constructor(model: MeshAssetData, projectController: IProjectController, mutationController: MutationController) {
    this._model = model;
    this.projectController = projectController;
    this.mutationController = mutationController;
    this.componentDependencyManager = new ComponentDependencyManager();
    this._mutator = new ModelEditorViewMutator(
      this,
      projectController,
    );
    this._mutatorNew = new ModelEditorViewMutatorNew(
      this,
      projectController,
      mutationController,
    );

    this._canvas = document.createElement('canvas');
    this.canvas.classList.add('w-full', 'h-full', '[image-rendering:_pixelated]');

    // @NOTE `preserveDrawingBuffer` needed to be able to capture canvas contents
    this.engine = new Engine(this.canvas, false, { preserveDrawingBuffer: true }, true);
    this.babylonScene = new BabylonScene(this.engine);

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
      switch (event.type) {
        case ProjectAssetEventType.Delete:
          if (event.asset.id === this.model.id) {
            // @TODO Close tab or something
            console.error(`[${ModelEditorViewController.name}] (onAssetChanged) Model asset was deleted. Should close tab: ${this.model.path}`);
            return;
          }
        // @NOTE Fall-through
        case ProjectAssetEventType.Modify: {
          // Collect all assets that are dependent on the asset that updated
          const allAffectedAssets: string[] = [
            event.asset.id,
            ...event.assetDependents,
          ];

          // Find all components that depend on these affected assets
          const allAffectedComponentData = this.componentDependencyManager.getAllDependentsForAssetIds(allAffectedAssets);

          // Reinitialise all affected components
          // @NOTE This "scene" only has one component
          if (allAffectedComponentData.length > 0) {
            const { assetIds, componentData, gameObjectData } = allAffectedComponentData[0];
            if (assetIds.includes(event.asset.id)) {
              console.log(`[${ModelEditorViewController.name}] (onAssetChanged) Reloading scene due to asset change: (assetId='${event.asset.id}') (componentId='${componentData.id}') (gameObjectId='${gameObjectData.id}')`);
            } else {
              console.log(`[${ModelEditorViewController.name}] (onAssetChanged) Reloading scene due to TRANSITIVE asset change: (source assetId='${event.asset.id}') (componentId='${componentData.id}') (gameObjectId='${gameObjectData.id}')`);
            }

            void this.reloadSceneData();
          }
          break;
        }
        case ProjectAssetEventType.Create:
        case ProjectAssetEventType.Rename:
          break;
        default:
          console.error(`[${ModelEditorViewController.name}] (onAssetChanged) Unimplemented asset event: `, event);
      }
    });

    this.unlistenToFileSystemEvents = () => {
      stopListeningToProjectFileEvents();
      stopListeningToAssetFileEvents();
    };

    makeAutoObservable(this);
  }

  public static async create(model: MeshAssetData, projectController: IProjectController, mutationController: MutationController): Promise<ModelEditorViewController> {
    const controller = new ModelEditorViewController(model, projectController, mutationController);
    await controller.buildScene();
    return controller;
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

    await this.babylonScene.whenReadyAsync();
  }

  public startBabylonView(): () => void {
    void this.reloadSceneData();

    const renderLoop = (): void => {
      this.babylonScene.render();
    };
    this.engine.runRenderLoop(renderLoop);

    /* @TODO is view active or something? */

    const resizeObserver = new ResizeObserver((entries) => {
      const newSize = entries[0].contentRect;
      this.engine.setSize(newSize.width * devicePixelRatio, newSize.height * devicePixelRatio, true);
    });
    resizeObserver.observe(this.canvas as unknown as Element); // @TODO FUCK YOU REACT!!!!!!

    this.mutationController.setMutatorActive(this.mutatorNew, true);

    /* Teardown - when scene view is unloaded */
    const onDestroyView = (): void => {
      resizeObserver.unobserve(this.canvas as unknown as Element); // @TODO FUCK YOU REACT!!!!!!
      if (!this.engine.isDisposed) {
        this.engine.stopRenderLoop(renderLoop);
        this.mutationController.setMutatorActive(this.mutatorNew, false);
      }
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
    this.mutatorNew.deregister();
  }

  private async createScene(): Promise<void> {
    /* Construct a game object to host the mesh for previewing */
    // @TODO Third copy of this logic... re-use from SceneViewController / Game.ts ?
    const gameObjectName = '__preview';

    /* Transform */
    const transformData = new TransformData(Vector3.zero(), Vector3.zero(), Vector3.one());
    const transform = new Transform(
      gameObjectName,
      this.babylonScene,
      undefined,
      transformData,
    );

    /* GameObject */
    const gameObjectData = new GameObjectData(uuid(), gameObjectName, transformData, [], []);
    const gameObject = this.previewGameObject = new GameObject(
      uuid(),
      gameObjectName,
      transform,
    );
    transform.gameObject = gameObject;

    /* Components */
    // Add mesh component to preview game object
    const meshAsset = await this.projectController.assetCache.loadAsset(this.model, this.babylonScene);
    runInAction(() => {
      const meshComponentData = new MeshComponentData(uuid(), this.model);
      const meshComponent = new MeshComponent(meshComponentData, gameObject, meshAsset);
      gameObject.addComponent(meshComponent);
      this.componentDependencyManager.registerDependency(meshComponentData, gameObjectData, meshComponent.assetDependencyIds);

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
    });
  }

  public async reloadSceneData(model?: MeshAssetData): Promise<void> {
    // Clear out the scene
    this.previewGameObject?.destroy();
    this.componentDependencyManager.clear();

    // Update data
    if (model !== undefined) {
      this._model = model;
    }

    await this.createScene();

    this.focusModel();
  }

  public getMaterialByName(materialName: string): RetroMaterial {
    const material = this.materialInstances?.find((material) => material.name === materialName);
    if (!material) {
      throw new Error(`Cannot get material, no material exists on ModelEditorViewController with name '${materialName}'`);
    }
    return material;
  }

  public selectMaterial(materialName: string): void {
    this._selectedMaterialName = materialName;
  }

  public focusModel(): void {
    // @TODO Replace this crappy Babylon logic with a REAL engine!!
    // const gameObject = this.findGameObjectById(gameObjectId);
    const gameObject = this.previewGameObject;
    if (gameObject === undefined) return;

    /**
     * Find all mesh components on this GameObject and within its hierarchy.
     */
    const getAllMeshComponents = (gameObject: GameObjectRuntime): MeshComponent[] => {
      const meshComponents = gameObject.components.filter((component) => component instanceof MeshComponent);
      const childMeshComponents = gameObject.transform.children.flatMap((child) => getAllMeshComponents(child.gameObject));
      return meshComponents.concat(childMeshComponents);
    };

    // Get all mesh components in this object's hierarchy
    const meshComponents = getAllMeshComponents(gameObject);

    // Find the absolute minimum and maximum of all these mesh components' bounding boxes
    let minimum: Vector3Babylon | undefined = undefined;
    let maximum: Vector3Babylon | undefined = undefined;
    for (const meshComponent of meshComponents) {
      for (const mesh of meshComponent.allSelectableMeshes) {
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        if (minimum === undefined) {
          minimum = boundingBox.minimumWorld.clone();
        } else {
          if (boundingBox.minimumWorld.x < minimum.x) {
            minimum.x = boundingBox.minimumWorld.x;
          }
          if (boundingBox.minimumWorld.y < minimum.y) {
            minimum.y = boundingBox.minimumWorld.y;
          }
          if (boundingBox.minimumWorld.z < minimum.z) {
            minimum.z = boundingBox.minimumWorld.z;
          }
        }
        if (maximum === undefined) {
          maximum = boundingBox.maximumWorld.clone();
        } else {
          if (boundingBox.maximumWorld.x > maximum.x) {
            maximum.x = boundingBox.maximumWorld.x;
          }
          if (boundingBox.maximumWorld.y > maximum.y) {
            maximum.y = boundingBox.maximumWorld.y;
          }
          if (boundingBox.maximumWorld.z > maximum.z) {
            maximum.z = boundingBox.maximumWorld.z;
          }
        }
      }
    }

    // Calculate size (half diagonal) of the absolute bounding box
    let boundingBoxRadius: number;
    if (minimum !== undefined && maximum !== undefined) {
      boundingBoxRadius = maximum.subtract(minimum).length() / 2;
    } else {
      boundingBoxRadius = 1;
    }

    // Use trig to calculate 'adjacent' side (i.e. distance) based on bounding box size and camera FOV
    const cameraDistance = boundingBoxRadius / Math.tan(this.sceneCamera.fov / 2);

    this.sceneCamera.target.setAll(0); // Focus on 0,0,0
    this.sceneCamera.radius = cameraDistance; // Set distance
    // Stop animating
    this.sceneCamera.inertialRadiusOffset = 0;
    this.sceneCamera.inertialPanningX = 0;
    this.sceneCamera.inertialPanningY = 0;
    this.sceneCamera.inertialAlphaOffset = 0;
    this.sceneCamera.inertialBetaOffset = 0;
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public get model(): MeshAssetData {
    return this._model;
  }

  public get mutator(): ModelEditorViewMutator {
    return this._mutator;
  }
  public get mutatorNew(): ModelEditorViewMutatorNew {
    return this._mutatorNew;
  }

  public get allMaterials(): RetroMaterial[] | undefined {
    return this.materialInstances;
  }

  public get selectedMaterialName(): string | undefined {
    return this._selectedMaterialName;
  }

  public get scene(): BabylonScene {
    return this.babylonScene;
  }
}
