import { makeAutoObservable } from 'mobx';
import { GamepadAxis, KeyCode, GamepadButton, MouseButton, PointerState } from '@lopoly/engine/input';
import { IEngine } from '@lopoly/engine/Engine';
import { Scene as LoPolyScene } from '@lopoly/engine/scene';
import { RayCast, RayCastMode } from '@lopoly/engine/collision';

import {
  GameObject as GameObjectRuntime,
  GameObject,
  GameObjectComponent,
  DirectionalLightComponent as DirectionalLightComponentRuntime,
  PointLightComponent as PointLightComponentRuntime,
} from '@polyzone/runtime/objects';
import { Scene } from '@polyzone/runtime/scene';
import { AssetCache } from '@polyzone/runtime/assets';
import { tanDegrees } from '@polyzone/core/math/util';

import { JsoncContainer } from '@lib/util/JsoncContainer';
import type { IProjectController } from '@lib/project/ProjectController';
import { SceneViewMutator, SceneViewMutatorNew } from '@lib/mutation/SceneView';
import { SceneDefinition } from '@lib/project/definition';
import { SceneData, GameObjectData } from '@lib/project/data';
import { ProjectSceneEventType } from '@lib/project/watcher/scenes';
import { ProjectFileEventType } from '@lib/project/watcher/project';
import { SceneDbRecord } from '@lib/project/data/SceneDb';
import { ProjectAssetEventType } from '@lib/project/watcher/assets';
import { ComponentDependencyManager } from '@lib/common/ComponentDependencyManager';
import { MutationController } from '@lib/mutation/MutationController';
import { IViewController, ViewCamera, ViewController } from '@lib/common/view';
import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from '@lib/project/data/components';

import { SceneViewSelectionCache } from './SceneViewSelectionCache';
import { isAssetDependentComponent, ISelectableObject, isSelectableObject, MeshComponent } from './components';
import { CurrentSelectionTool, SelectionManager, SelectionManagerResources } from './SelectionManager';


export interface ISceneViewController extends IViewController<SceneViewMutator, SceneViewMutatorNew> {
  setCurrentTool(tool: CurrentSelectionTool): void;
  focusSelected(): void;
  addToSelectionCache(gameObjectId: string, component: ISelectableObject): void;
  removeFromSelectionCache(component: ISelectableObject): void;
  createGameObject(gameObjectData: GameObjectData, parentGameObject?: GameObject): Promise<GameObjectRuntime>;
  createGameObjectComponent(componentData: IComposerComponentData, gameObject: GameObjectRuntime, gameObjectData: GameObjectData, atIndex?: number): Promise<void>;
  reinitializeComponentInstance(componentData: IComposerComponentData, gameObjectData: GameObjectData): Promise<void>;
  reloadSceneData(scene: SceneDbRecord): Promise<void>;
  findGameObjectById(gameObjectId: string): GameObjectRuntime | undefined;

  get sceneData(): SceneData;
  get sceneJson(): JsoncContainer<SceneDefinition>;
  get sceneDefinition(): SceneDefinition;
  get selectedObject(): GameObjectRuntime | undefined
  get selectedObjectData(): GameObjectData | undefined;
  get selectedObjectId(): string | undefined;
  get selectionManager(): SelectionManager;
  get camera(): ViewCamera;
}

export class SceneViewController implements ISceneViewController {
  private readonly componentDependencyManager: ComponentDependencyManager;
  private readonly _selectionManager: SelectionManager;
  private readonly selectionCache: SceneViewSelectionCache;
  private readonly unlistenToFileSystemEvents: () => void;

  private readonly viewController: ViewController<SceneViewMutator, SceneViewMutatorNew>;

  private constructor(
    scene: SceneData,
    sceneJson: JsoncContainer<SceneDefinition>,
    projectController: IProjectController,
    mutationController: MutationController,
    selectionManagerResources: SelectionManagerResources,
  ) {
    this.componentDependencyManager = new ComponentDependencyManager();
    this.selectionCache = new SceneViewSelectionCache();
    this.viewController = new ViewController(
      projectController,
      mutationController,
      new SceneViewMutator(this, projectController),
      new SceneViewMutatorNew(this, projectController, mutationController),
      scene,
      sceneJson,
    );

    this.configureInput(this.engine);
    this._selectionManager = new SelectionManager(this.lopolyScene, this, selectionManagerResources);
    this.camera.onClickPress = (pointer) => this.selectionManager.onClickPress(pointer);
    this.camera.onClickSelect = (pointer) => this.onClickSelect(pointer);

    const stopListeningToProjectFileEvents = projectController.filesWatcher.onProjectFileChanged((event) => {
      if (event.type === ProjectFileEventType.Modify) {
        const scene = event.project.scenes.getById(this.sceneData.id);
        if (scene === undefined) {
          // @TODO - close tab or something (gracefully exit)
          throw new Error(`Error while reloading scene due to project file change - no scene with ID '${this.sceneData.id}' could be found in new project data`);
        } else {
          void this.reloadSceneData(scene);
        }
      }
    });
    const stopListeningToSceneFileEvents = projectController.filesWatcher.onSceneChanged((event) => {
      // Ignore events for other scenes
      if (event.scene.data.id !== this.sceneData.id) return;

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
            ...event.getAssetDependents(this),
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

  public static async create(scene: SceneData, sceneJson: JsoncContainer<SceneDefinition>, projectController: IProjectController, mutationController: MutationController): Promise<SceneViewController> {
    const selectionManagerResources = await SelectionManager.loadResources();
    const sceneViewController = new SceneViewController(scene, sceneJson, projectController, mutationController, selectionManagerResources);
    await sceneViewController.buildScene();
    return sceneViewController;
  }

  private configureInput(engine: IEngine): void {
    engine.inputSystem.configure({
      axes: [
        {
          name: 'camera:move:x', bindings: [
            { min: KeyCode.KeyA, max: KeyCode.KeyD },
            GamepadAxis.JoyLeftX,
          ],
        },
        {
          name: 'camera:move:y', bindings: [
            { min: KeyCode.KeyS, max: KeyCode.KeyW },
            GamepadAxis.JoyLeftY,
          ],
        },
        {
          name: 'camera:move:z', bindings: [
            { min: KeyCode.ShiftLeft, max: KeyCode.Space },
            { min: GamepadButton.L2, max: GamepadButton.R2 },
          ],
        },
      ],
      buttons: [
        {
          // @TODO What if the user has click bound to right click?
          name: 'mouse:click',
          bindings: [MouseButton.Left],
        },
      ],
    });
  }

  private async buildScene(): Promise<void> {
    await this.createScene();

    // @TODO Raycasting
    // this.lopolyScene.onPointerObservable.add((pointerInfo) => {
    //   if (pointerInfo.type === PointerEventTypes.POINTERTAP) {
    //     if (!pointerInfo.pickInfo?.hit) {
    //       this.selectionManager.deselectAll();
    //     } else if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh !== null) {
    //       const pickedGameObjectId = this.selectionCache.get(pointerInfo.pickInfo.pickedMesh);
    //       if (pickedGameObjectId === undefined) {
    //         console.error(`Picked mesh but found no corresponding GameObject ID in cache. Has it been populated or updated? Picked mesh:`, pointerInfo.pickInfo.pickedMesh);
    //       } else {
    //         this.selectionManager.select(pickedGameObjectId);
    //       }
    //     }
    //   }
    // });
  }

  private onClickSelect(pointer: PointerState): void {
    if (pointer.x !== undefined && pointer.y !== undefined) {
      this.camera.rayCastFromCamera(pointer.x, pointer.y, (rayOrigin, rayDirection) => {
        const result = RayCast.scene(rayOrigin, rayDirection, this.lopolyScene, RayCastMode.Infinite);
        const pickedModel = result?.target;
        if (pickedModel !== undefined) {
          const pickedGameObjectId = this.selectionCache.get(pickedModel);
          if (pickedGameObjectId === undefined) {
            console.error(`Picked mesh but found no corresponding GameObject ID in cache. Has it been populated or updated? Picked mesh: '${pickedModel.name}'`);
          } else {
            this.selectionManager.select(pickedGameObjectId);
          }
        } else {
          this.selectionManager.deselectAll();
        }
      });
    }
  }

  public destroy(): void {
    this.viewController.destroy();
    this.selectionManager.destroy();
    this.unlistenToFileSystemEvents();
    this.canvas.remove();
    this.mutatorNew.deregister();
  }

  private async createScene(): Promise<void> {
    await Promise.all(
      this.sceneData.objects.map((sceneObject) =>
        this.createGameObject(sceneObject),
      ),
    );
  }

  /**
   * Wrapper for `createGameObject()` with bindings into this SceneViewController.
   */
  public async createGameObject(gameObjectData: GameObjectData, parentGameObject?: GameObject): Promise<GameObjectRuntime> {
    // Construct blank GameObject
    const gameObject = new GameObject(
      gameObjectData.id,
      gameObjectData.name,
      this.scene,
      parentGameObject,
    );
    gameObject.position = gameObjectData.transform.position;
    gameObject.rotation.euler = gameObjectData.transform.rotation;
    gameObject.scale = gameObjectData.transform.scale;

    // Construct child objects recursively
    await Promise.all(gameObjectData.children.map((childObjectData) =>
      this.createGameObject(
        childObjectData,
        gameObject,
      )),
    );

    // Load game object components
    await Promise.all(gameObjectData.components.map(async (componentData) =>
      this.createGameObjectComponent(
        componentData,
        gameObject,
        gameObjectData,
      ),
    ));

    // Add top-level objects to scene
    if (parentGameObject === undefined) {
      this.scene.addGameObject(gameObject);
    }

    return gameObject;
  }

  /**
   * Wrapper for `createEditorGameObjectComponent()` with bindings into this SceneViewController.
   */
  public async createGameObjectComponent(
    componentData: IComposerComponentData,
    gameObject: GameObjectRuntime,
    gameObjectData: GameObjectData,
    atIndex?: number,
  ): Promise<void> {
    let newComponent: GameObjectComponent | undefined = undefined;

    if (componentData instanceof MeshComponentData) {
      /* Mesh component */
      // @TODO Just use runtime component IMO, refactor selection stuff below
      newComponent = await MeshComponent.instantiateFromData(componentData, gameObject, atIndex, this.assetCache);
    } else if (componentData instanceof ScriptComponentData) {
      /* Custom component script */
      /* @NOTE Script has no effect in the Composer */
    } else if (componentData instanceof CameraComponentData) {
      /* Camera component */
      /* @NOTE Camera has no effect in the Composer */
    } else if (componentData instanceof DirectionalLightComponentData) {
      /* Directional Light component */
      // @TODO
      newComponent = await DirectionalLightComponentRuntime.instantiateFromData(componentData, gameObject, atIndex);
    } else if (componentData instanceof PointLightComponentData) {
      /* Point Light component */
      newComponent = await PointLightComponentRuntime.instantiateFromData(componentData, gameObject, atIndex);
    } else {
      throw new Error(`Unimplemented component data type: ${componentData.constructor.name}`);
    }

    // Only continue processing if a component was actually made
    if (newComponent === undefined) return;

    // Store selectable objects in cache (for efficient lookup of model => game object on click)
    // @TODO move selectable object stuff to here outside of MeshComponent
    if (isSelectableObject(newComponent)) {
      this.addToSelectionCache(gameObjectData.id, newComponent);
    }

    // Store asset dependencies in a cache (for reloading components when assets change)
    if (isAssetDependentComponent(newComponent)) {
      this.componentDependencyManager.registerDependency(
        componentData,
        gameObjectData,
        newComponent.assetDependencyIds,
      );
    }
  }

  public setCurrentTool(tool: CurrentSelectionTool): void {
    this.selectionManager.currentTool = tool;
  }

  public focusSelected(): void {
    if (this.selectionManager.selectedObjectId !== undefined) {
      // Get the bounding box of the currently selected object
      const selectionBoundingBox = this.selectionManager.selectedObjectBoundingBox!;
      const boundingBoxCenter = selectionBoundingBox.absolutePosition;

      // Calculate the radius of a sphere that all points of the bounding box lay on.
      // @NOTE Every vertex of a cuboid is the same distance from the center of the cuboid
      // so... we only need one vertex. Which kind of hurts to think about.
      // Convert vertex into coordinates relative to the bounding box center
      const boundingBoxVertex = selectionBoundingBox.getVerticesWorldSpace()[0].subtract(boundingBoxCenter);
      // Scale factor for sphere - increase to "zoom out" more
      const PaddingScalar = 1.2;
      const boundingBoxRadius = boundingBoxVertex.length() * PaddingScalar;

      // Use trig to calculate 'adjacent' side of right-angled triangle (i.e. distance) based on bounding box size and camera FOV
      const cameraDistance = boundingBoxRadius / tanDegrees(this.camera.fov / 2);

      // Compute camera new position based on current viewing direction and desired distance
      const cameraVector = this.camera.getViewingDirection();
      this.camera.absolutePosition = boundingBoxCenter.subtract(
        cameraVector.normalizeSelf().scaleSelf(cameraDistance),
      );
    }
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
    const componentIndex = gameObjectInstance.components.findIndex((component) => component.id === componentData.id);
    if (componentIndex === undefined) throw new Error(`Cannot reinitialize component. Component with ID '${componentData.id}' is not a component of GameObject with ID '${gameObjectData.id}'`);

    const componentInstance = gameObjectInstance.components[componentIndex];

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
    await this.createGameObjectComponent(componentData, gameObjectInstance, gameObjectData, componentIndex);
  }

  // @TODO we should maybe just "Resume" the engine rather than tearing it down / up all the time
  public async reloadSceneData(scene: SceneDbRecord): Promise<void> {
    // Clear out the scene
    this.selectionManager.deselectAll();
    this.selectionCache.clear();
    this.componentDependencyManager.clear();
    this.scene.topLevelGameObjects.forEach((topLevelGameObject) => {
      this.scene.destroyGameObject(topLevelGameObject);
    });

    // Update scene data
    this.viewController.bindScene(scene.data, scene.jsonc);

    await this.createScene();
  }

  public findGameObjectById(gameObjectId: string): GameObjectRuntime | undefined {
    return this.scene.findGameObjectById(gameObjectId);
  }

  /* IViewController implementation through encapsulated object */
  // @TODO Rename
  public startBabylonView(): () => void { return this.viewController.startBabylonView(); }
  public get canvas(): HTMLCanvasElement { return this.viewController.canvas; }
  public get assetCache(): AssetCache { return this.viewController.assetCache; }
  public get mutator(): SceneViewMutator { return this.viewController.mutator; }
  public get mutatorNew(): SceneViewMutatorNew { return this.viewController.mutatorNew; }
  private get engine(): IEngine { return this.viewController.engine; }
  private get scene(): Scene { return this.viewController.scene; }
  private get lopolyScene(): LoPolyScene { return this.scene.lopolyScene; }

  public get sceneData(): SceneData { return this.viewController.sceneData; }
  public get sceneJson(): JsoncContainer<SceneDefinition> { return this.viewController.sceneJson; }
  public get sceneDefinition(): SceneDefinition { return this.viewController.sceneJson.value; }

  public get selectedObject(): GameObjectRuntime | undefined {
    if (this.selectedObjectId) {
      return this.findGameObjectById(this.selectedObjectId);
    } else {
      return undefined;
    }
  }
  public get selectedObjectData(): GameObjectData | undefined {
    if (this.selectedObjectId) {
      return this.sceneData.findGameObject(this.selectedObjectId);
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

  public get camera(): ViewCamera { return this.viewController.camera; }
}
