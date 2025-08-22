import { makeAutoObservable } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { FreeCamera as FreeCameraBabylon } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight as HemisphericLightBabylon } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import "@babylonjs/loaders/OBJ/objFileLoader";
import "@babylonjs/loaders/glTF";
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import '@babylonjs/core/Culling/ray'; // @NOTE needed for mesh picking - contains side effects

import { GameObjectComponent } from '@polyzone/core/src/world';
import {
  Transform as TransformRuntime,
  GameObject as GameObjectRuntime,
} from '@polyzone/runtime/src/world';
import { toColor3Babylon } from '@polyzone/runtime/src/util';
import { createGameObject } from '@polyzone/runtime/src/world/createGameObject';

import { JsoncContainer } from '@lib/util/JsoncContainer';
import type { IProjectController } from '@lib/project/ProjectController';
import { SceneViewMutator, SceneViewMutatorNew } from '@lib/mutation/SceneView';
import { SceneDefinition } from '@lib/project/definition';
import { IComposerComponentData } from '@lib/project/data/components';
import { SceneData, GameObjectData } from '@lib/project/data';
import { ProjectSceneEventType } from '@lib/project/watcher/scenes';
import { ProjectFileEventType } from '@lib/project/watcher/project';
import { SceneDbRecord } from '@lib/project/data/SceneDb';
import { ProjectAssetEventType } from '@lib/project/watcher/assets';
import { ComponentDependencyManager } from '@lib/common/ComponentDependencyManager';
import { createEditorGameObjectComponent } from '@lib/common/GameObjects';
import { SceneViewSelectionCache } from './SceneViewSelectionCache';
import { isAssetDependentComponent, ISelectableObject, isSelectableObject } from './components';
import { CurrentSelectionTool, SelectionManager } from './SelectionManager';

export interface ISceneViewController {
  startBabylonView(): () => void;
  destroy(): void;
  setCurrentTool(tool: CurrentSelectionTool): void;
  addToSelectionCache(gameObjectId: string, component: ISelectableObject): void;
  removeFromSelectionCache(component: ISelectableObject): void;
  createGameObject(gameObjectData: GameObjectData, parentTransform?: TransformRuntime): Promise<GameObjectRuntime>;
  createGameObjectComponent(gameObjectData: GameObjectData, gameObject: GameObjectRuntime, componentData: IComposerComponentData): Promise<GameObjectComponent | undefined>;
  reinitializeComponentInstance(componentData: IComposerComponentData, gameObjectData: GameObjectData): Promise<void>;
  reloadSceneData(scene: SceneDbRecord): Promise<void>;
  findGameObjectById(gameObjectId: string): GameObjectRuntime | undefined;
  addGameObject(gameObject: GameObjectRuntime): void;
  removeGameObject(gameObject: GameObjectRuntime): void;

  get canvas(): HTMLCanvasElement;
  get scene(): SceneData;
  get sceneJson(): JsoncContainer<SceneDefinition>;
  get sceneDefinition(): SceneDefinition;
  // @TODO Remove, replace with New
  get mutator(): SceneViewMutator;
  get mutatorNew(): SceneViewMutatorNew;
  get selectedObjectData(): GameObjectData | undefined;
  get selectedObjectId(): string | undefined;
  get selectionManager(): SelectionManager;
}

export class SceneViewController implements ISceneViewController {
  private _scene: SceneData;
  private _sceneJson: JsoncContainer<SceneDefinition>;
  private readonly projectController: IProjectController;
  private readonly _mutator: SceneViewMutator;
  private readonly _mutatorNew: SceneViewMutatorNew;

  private readonly _canvas: HTMLCanvasElement;
  private readonly engine: Engine;
  private readonly babylonScene: BabylonScene;
  private sceneCamera!: FreeCameraBabylon;
  private readonly componentDependencyManager: ComponentDependencyManager;
  private readonly _selectionManager: SelectionManager;
  private readonly selectionCache: SceneViewSelectionCache;
  private readonly unlistenToFileSystemEvents: () => void;

  private _gameObjectInstances: GameObjectRuntime[];

  private constructor(scene: SceneData, sceneJson: JsoncContainer<SceneDefinition>, projectController: IProjectController) {
    this._scene = scene;
    this._sceneJson = sceneJson;
    this.projectController = projectController;
    this._gameObjectInstances = [];
    this.componentDependencyManager = new ComponentDependencyManager();
    this.selectionCache = new SceneViewSelectionCache();
    this._mutator = new SceneViewMutator(
      this,
      projectController,
    );
    this._mutatorNew = new SceneViewMutatorNew(
      this,
      projectController,
    );

    this._canvas = document.createElement('canvas');
    this.canvas.classList.add('w-full', 'h-full');

    // @NOTE `preserveDrawingBuffer` needed to be able to capture canvas contents
    this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: true }, true);
    this.babylonScene = new BabylonScene(this.engine);
    this._selectionManager = new SelectionManager(this.babylonScene, this);

    const stopListeningToProjectFileEvents = projectController.filesWatcher.onProjectFileChanged((event) => {
      if (event.type === ProjectFileEventType.Modify) {
        const scene = event.project.scenes.getById(this.scene.id);
        if (scene === undefined) {
          // @TODO - close tab or something (gracefully exit)
          throw new Error(`Error while reloading scene due to project file change - no scene with ID '${this.scene.id}' could be found in new project data`);
        } else {
          void this.reloadSceneData(scene);
        }
      }
    });
    const stopListeningToSceneFileEvents = projectController.filesWatcher.onSceneChanged((event) => {
      // Ignore events for other scenes
      if (event.scene.data.id !== this.scene.id) return;

      if (event.type === ProjectSceneEventType.Modify) {
        void this.reloadSceneData(event.scene);
      } else if (event.type === ProjectSceneEventType.Delete) {
        // @TODO close scene tab
      }
    });
    const stopListeningToAssetEvents = projectController.filesWatcher.onAssetChanged((event) => {
      switch (event.type) {
        case ProjectAssetEventType.Modify:
        case ProjectAssetEventType.Delete: {
          /**
           * Collect all assets that will need to be reloaded.
           * Updated asset + any assets that depend on it
           */
          const allAffectedAssets: string[] = [
            event.asset.id,
            ...event.assetDependents,
          ];

          // Find all components that depend on these affected assets
          const allAffectedComponentData = this.componentDependencyManager.getAllDependentsForAssetIds(allAffectedAssets);

          // Reinitialise all affected components
          for (const { componentData, gameObjectData, assetIds } of allAffectedComponentData) {
            if (assetIds.includes(event.asset.id)) {
              console.log(`[DEBUG] [SceneViewController] (filesWatcher.onAssetChanged) Reinitializing component due to asset change: (assetId='${event.asset.id}') (componentId='${componentData.id}') (gameObjectId='${gameObjectData.id}')`);
            } else {
              console.log(`[DEBUG] [SceneViewController] (filesWatcher.onAssetChanged) Reinitializing component due to TRANSITIVE asset change: (source assetId='${event.asset.id}') (componentId='${componentData.id}') (gameObjectId='${gameObjectData.id}')`);
            }

            void this.reinitializeComponentInstance(componentData, gameObjectData);
          }
          break;
        }
        case ProjectAssetEventType.Create:
        case ProjectAssetEventType.Rename:
          break;
        default:
          console.error(`[AssetDependencyCache] (onProjectAssetChanged) Unimplemented asset event: `, event);
      }
    });

    this.unlistenToFileSystemEvents = () => {
      stopListeningToProjectFileEvents();
      stopListeningToSceneFileEvents();
      stopListeningToAssetEvents();
    };

    makeAutoObservable(this);
  }

  public static async create(scene: SceneData, sceneJson: JsoncContainer<SceneDefinition>, projectController: IProjectController): Promise<SceneViewController> {
    const sceneViewController = new SceneViewController(scene, sceneJson, projectController);
    await sceneViewController.buildScene();
    return sceneViewController;
  }

  private async buildScene(): Promise<void> {
    // @DEBUG Random camera constants
    const camera = this.sceneCamera = new FreeCameraBabylon("main", new Vector3Babylon(6, 2, -1), this.babylonScene);
    camera.setTarget(Vector3Babylon.Zero());
    camera.attachControl(this.canvas, true);
    camera.speed = 0.3;
    camera.minZ = 0.1;

    /* @NOTE WASD+Shift+Space */
    camera.keysUp.push(87);
    camera.keysLeft.push(65);
    camera.keysRight.push(68);
    camera.keysDown.push(83);
    camera.keysUpward.push(32);
    camera.keysDownward.push(16);

    await this.createScene();

    await this.babylonScene.whenReadyAsync();

    this.babylonScene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERTAP) {
        if (!pointerInfo.pickInfo?.hit) {
          this.selectionManager.deselectAll();
        } else if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh !== null) {
          const pickedGameObjectId = this.selectionCache.get(pointerInfo.pickInfo.pickedMesh);
          if (pickedGameObjectId === undefined) {
            console.error(`Picked mesh but found no corresponding GameObject ID in cache. Has it been populated or updated? Picked mesh:`, pointerInfo.pickInfo.pickedMesh);
          } else {
            this.selectionManager.select(pickedGameObjectId);
          }
        }
      }
    });
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
    this.selectionManager.destroy();
    this.babylonScene.onPointerObservable.clear();
    this.babylonScene.dispose();
    this.engine.dispose();
    this.unlistenToFileSystemEvents();
    this._canvas.remove();
    for (const gameObjectInstance of this._gameObjectInstances) {
      gameObjectInstance.destroy();
    }
    void this.projectController.assetCache.disposeSceneInstances(this.babylonScene);
  }

  private async createScene(): Promise<void> {
    /* Scene clear color */
    this.babylonScene.clearColor = toColor3Babylon(this.scene.config.clearColor).toColor4();

    /* Set up global ambient lighting */
    const ambientLight = new HemisphericLightBabylon("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    ambientLight.intensity = this.scene.config.lighting.ambient.intensity;
    ambientLight.diffuse = toColor3Babylon(this.scene.config.lighting.ambient.color);
    ambientLight.groundColor = toColor3Babylon(this.scene.config.lighting.ambient.color);
    ambientLight.specular = Color3Babylon.Black();

    await Promise.all(
      this.scene.objects.map((sceneObject) =>
        this.createGameObject(sceneObject),
      ),
    );
  }

  /**
   * Wrapper for `createGameObject()` with bindings into this SceneViewController.
   * Automatically calls `addGameObject()` on the newly created GameObject.
   */
  public async createGameObject(gameObjectData: GameObjectData, parentTransform?: TransformRuntime): Promise<GameObjectRuntime> {
    const gameObject = await createGameObject(
      gameObjectData,
      parentTransform,
      this.babylonScene,
      (gameObject, componentData) => this.createGameObjectComponent(
        gameObjectData,
        gameObject,
        componentData as IComposerComponentData,
      ),
    );

    // Flatten tree of game object instances
    // We have to manually keep a record of these instances anyway
    const collectGameObjectInstances = (gameObject: GameObjectRuntime): void => {
      this.addGameObject(gameObject);
      for (const childTransform of gameObject.transform.children) {
        collectGameObjectInstances(childTransform.gameObject);
      }
    };
    collectGameObjectInstances(gameObject);

    return gameObject;
  }

  /**
   * Wrapper for `createEditorGameObjectComponent()` with bindings into this SceneViewController.
   * Automatically calls `gameObject.addComponent()` with the newly created GameObjectComponent.
   */
  public async createGameObjectComponent(gameObjectData: GameObjectData, gameObject: GameObjectRuntime, componentData: IComposerComponentData): Promise<GameObjectComponent | undefined> {
    const component = await createEditorGameObjectComponent(
      gameObject,
      componentData,
      this.babylonScene,
      this.projectController.assetCache,
      (newComponent) => this.addToSelectionCache(gameObjectData.id, newComponent),
      (newComponent) => this.componentDependencyManager.registerDependency(
        componentData,
        gameObjectData,
        newComponent.assetDependencyIds,
      ),
    );

    return component;
  }

  /**
   * Adds a GameObject instance to the list of game objects in this scene.
   */
  public addGameObject(gameObject: GameObjectRuntime): void {
    // @NOTE Prevent duplicates
    if (!this._gameObjectInstances.some((existingGameObject) => existingGameObject.id === gameObject.id)) {
      this._gameObjectInstances.push(gameObject);
    }
  }

  /**
   * Removes a GameObject instance from the list of game objects in this scene.
   */
  public removeGameObject(gameObject: GameObjectRuntime): void {
    // @NOTE Fail silently
    const index = this._gameObjectInstances.findIndex((existingGameObject) => existingGameObject.id === gameObject.id);
    if (index !== -1) {
      this._gameObjectInstances.splice(index, 1);
    }
  }

  public setCurrentTool(tool: CurrentSelectionTool): void {
    this.selectionManager.currentTool = tool;
  }

  public addToSelectionCache(gameObjectId: string, component: ISelectableObject): void {
    this.selectionCache.add(gameObjectId, component.allSelectableMeshes);
  }

  public removeFromSelectionCache(component: ISelectableObject): void {
    this.selectionCache.remove(component.allSelectableMeshes);
  }

  /**
   * Reload the instance of a component from its definition for an object loaded in the scene view.
   * @param componentData Data for GameObjectComponent. The previous instance of this component will be destroyed.
   * @param gameObjectData GameObject on which this component lives
   */
  public async reinitializeComponentInstance(componentData: IComposerComponentData, gameObjectData: GameObjectData): Promise<void> {
    const gameObjectInstance = this.findGameObjectById(gameObjectData.id);
    if (gameObjectInstance === undefined) throw new Error(`Cannot reinitialize component. No GameObject with id '${gameObjectData.id}' could be found in the scene`);
    const componentInstance = gameObjectInstance.components.find((component) => component.id === componentData.id);
    if (componentInstance === undefined) throw new Error(`Cannot reinitialize component. Component with ID '${componentData.id}' is not a component of GameObject with ID '${gameObjectData.id}'`);

    // Remove selectable components from selection cache
    if (isSelectableObject(componentInstance)) {
      this.removeFromSelectionCache(componentInstance);
    }

    // Remove registered asset dependency (since component instance is about to be destroyed)
    if (isAssetDependentComponent(componentInstance)) {
      this.componentDependencyManager.unregisterDependency(componentInstance.id);
    }

    // Remove (and destroy) component instance
    gameObjectInstance.removeComponent(componentInstance.id);

    // Re-create component instance
    const component = await this.createGameObjectComponent(gameObjectData, gameObjectInstance, componentData);
    if (component !== undefined) {
      gameObjectInstance.addComponent(component);
    }
  }

  public async reloadSceneData(scene: SceneDbRecord): Promise<void> {
    // Clear out the scene
    this.selectionManager.deselectAll();
    this.selectionCache.clear();
    this.componentDependencyManager.clear();
    this._gameObjectInstances.forEach((instance) => instance.destroy());
    this._gameObjectInstances = [];

    const rootNodes = [...this.babylonScene.rootNodes];
    for (const sceneObject of rootNodes) {
      if (sceneObject !== this.sceneCamera) {
        sceneObject.dispose();
      }
    }

    // @TODO Do we need to explicitly iterate through, like, materials and textures and stuff?

    // Update data
    this._scene = scene.data;
    this._sceneJson = scene.jsonc;

    await this.createScene();
  }

  public findGameObjectById(gameObjectId: string): GameObjectRuntime | undefined {
    return this._gameObjectInstances.find((gameObject) => gameObject.id === gameObjectId);
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public get scene(): SceneData {
    return this._scene;
  }

  public get sceneJson(): JsoncContainer<SceneDefinition> {
    return this._sceneJson;
  }

  public get sceneDefinition(): SceneDefinition {
    return this._sceneJson.value;
  }

  public get mutator(): SceneViewMutator {
    return this._mutator;
  }
  public get mutatorNew(): SceneViewMutatorNew {
    return this._mutatorNew;
  }

  public get selectedObjectData(): GameObjectData | undefined {
    if (this.selectedObjectId) {
      return this.scene.findGameObject(this.selectedObjectId);
    } else {
      return undefined;
    }
  }
  public get selectedObjectId(): string | undefined {
    return this.selectionManager.selectedObjectId;
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }
}
