import { makeAutoObservable } from 'mobx';
import { CameraNode, IScene } from '@lopoly/engine/scene';

import {
  GameObject as GameObjectRuntime,
  createGameObject,
  GameObject,
} from '@polyzone/runtime/objects';
import { Scene as LoPolyScene } from '@lopoly/engine/scene';

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
import { MutationController } from '@lib/mutation/MutationController';
import { SceneViewSelectionCache } from './SceneViewSelectionCache';
import { isAssetDependentComponent, ISelectableObject, isSelectableObject } from './components';
import { CurrentSelectionTool, SelectionManager, SelectionManagerResources } from './SelectionManager';
import { Vector3 } from '@polyzone/core/math';
import { clamp, GamepadAxis, GamepadButton, IEngine, IInputSystem, KeyCode, MouseButton } from '@lopoly/engine';
import { Scene } from '@polyzone/runtime/scene';
import { IViewController, ViewCamera, ViewController } from '@lib/common/view';
import { AssetCache } from '@polyzone/runtime/assets';

export interface ISceneViewController extends IViewController<SceneViewMutator, SceneViewMutatorNew> {
  setCurrentTool(tool: CurrentSelectionTool): void;
  focusObject(gameObject: GameObjectRuntime): void;
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
    this.camera.onClickPress = (pointer) => this._selectionManager.onClickPress(pointer);

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
    const gameObject = await createGameObject(
      gameObjectData,
      parentGameObject,
      this.scene,
      (componentData, gameObject, atIndex) => this.createGameObjectComponent(
        componentData as IComposerComponentData,
        gameObject,
        gameObjectData,
        atIndex,
      ),
    );

    this.scene.addGameObject(gameObject);

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
    await createEditorGameObjectComponent(
      componentData,
      gameObject,
      atIndex,
      this.assetCache,
      (newComponent) => this.addToSelectionCache(gameObjectData.id, newComponent),
      (newComponent) => this.componentDependencyManager.registerDependency(
        componentData,
        gameObjectData,
        newComponent.assetDependencyIds,
      ),
    );
  }

  public setCurrentTool(tool: CurrentSelectionTool): void {
    this.selectionManager.currentTool = tool;
  }

  public focusObject(gameObject: GameObjectRuntime): void {
    console.warn(`[${SceneViewController.name}] (${this.focusObject.name}) Not yet implemented`);
    // // @TODO Replace this crappy Babylon logic with a REAL engine!!
    // const [boundingBoxMin, boundingBoxMax] = this.getBoundingBoxFor(gameObject);
    // const boundingBoxCenter = boundingBoxMax.add(boundingBoxMin).scaleInPlace(0.5);
    // const viewTarget = this.sceneCamera instanceof ArcRotateCamera ? Vector3.Zero() : boundingBoxCenter;
    // const boundingBoxRadius = Math.max(
    //   boundingBoxMax.subtract(viewTarget).length(),
    //   boundingBoxMin.subtract(viewTarget).length(),
    // );

    // // Use trig to calculate 'adjacent' side of right-angled triangle (i.e. distance) based on bounding box size and camera FOV
    // const cameraDistance = boundingBoxRadius / Math.tan(this.sceneCamera.fov / 2);

    // const camera: TargetCamera = this.sceneCamera;
    // if (camera instanceof ArcRotateCamera) {
    //   camera.target.copyFrom(viewTarget);
    //   camera.radius = cameraDistance; // Set distance
    //   // Stop animating
    //   camera.inertialRadiusOffset = 0;
    //   camera.inertialPanningX = 0;
    //   camera.inertialPanningY = 0;
    //   camera.inertialAlphaOffset = 0;
    //   camera.inertialBetaOffset = 0;
    // } else if (camera instanceof FreeCamera) {
    //   // Move camera such that it has the same direction but with the new distance, pointing at the target
    //   const cameraDirection = camera.getDirection(Vector3.Forward());
    //   const cameraPosition = boundingBoxCenter.subtract(
    //     cameraDirection.normalize().scale(cameraDistance),
    //   );
    //   camera.position.copyFrom(cameraPosition);
    //   camera.cameraDirection.setAll(0); // Stop movement
    //   camera.cameraRotation.setAll(0); // Stop rotation
    // }
  }

  // private combineBoundingBoxes(boundingBoxes: BoundingBox[]): BoundingBox {
  //   let minimum: Vector3 | undefined = undefined;
  //   let maximum: Vector3 | undefined = undefined;
  //   for (const boundingBox of boundingBoxes) {
  //     const [boundingBoxMin, boundingBoxMax] = boundingBox;
  //     if (minimum === undefined) {
  //       minimum = boundingBoxMin.clone();
  //     } else {
  //       if (boundingBoxMin.x < minimum.x) {
  //         minimum.x = boundingBoxMin.x;
  //       }
  //       if (boundingBoxMin.y < minimum.y) {
  //         minimum.y = boundingBoxMin.y;
  //       }
  //       if (boundingBoxMin.z < minimum.z) {
  //         minimum.z = boundingBoxMin.z;
  //       }
  //     }
  //     if (maximum === undefined) {
  //       maximum = boundingBoxMax.clone();
  //     } else {
  //       if (boundingBoxMax.x > maximum.x) {
  //         maximum.x = boundingBoxMax.x;
  //       }
  //       if (boundingBoxMax.y > maximum.y) {
  //         maximum.y = boundingBoxMax.y;
  //       }
  //       if (boundingBoxMax.z > maximum.z) {
  //         maximum.z = boundingBoxMax.z;
  //       }
  //     }
  //   }
  //   return [minimum ?? Vector3.Zero(), maximum ?? Vector3.Zero()];
  // };

  // private getBoundingBoxFor(gameObject: GameObjectRuntime): BoundingBox {
  //   const meshComponents = gameObject.components.filter((component) => component instanceof MeshComponent);
  //   const meshComponentBoundingBoxes = meshComponents.map((meshComponent) => {
  //     const meshPartsBoundingBoxes = meshComponent.allSelectableMeshes.map((mesh) => {
  //       const boundingBox = mesh.getBoundingInfo().boundingBox;
  //       return [boundingBox.minimumWorld, boundingBox.maximumWorld] as BoundingBox;
  //     });
  //     return this.combineBoundingBoxes(meshPartsBoundingBoxes);
  //   });
  //   const childrenBoundingBoxes = gameObject.transform.children.map((child) => this.getBoundingBoxFor(child.gameObject));

  //   if (meshComponentBoundingBoxes.length === 0 && childrenBoundingBoxes.length === 0) {
  //     // GameObject has no MeshComponents OR children. Just return simple bounding box
  //     const DefaultBoundingBoxHalfWidth = 0.5;
  //     return [
  //       new Vector3(
  //         gameObject.transform.absolutePosition.x - DefaultBoundingBoxHalfWidth,
  //         gameObject.transform.absolutePosition.y - DefaultBoundingBoxHalfWidth,
  //         gameObject.transform.absolutePosition.z - DefaultBoundingBoxHalfWidth,
  //       ),
  //       new Vector3(
  //         gameObject.transform.absolutePosition.x + DefaultBoundingBoxHalfWidth,
  //         gameObject.transform.absolutePosition.y + DefaultBoundingBoxHalfWidth,
  //         gameObject.transform.absolutePosition.z + DefaultBoundingBoxHalfWidth,
  //       ),
  //     ];
  //   } else {
  //     // GameObject has at least one MeshComponent or child GameObject
  //     return this.combineBoundingBoxes(meshComponentBoundingBoxes.concat(childrenBoundingBoxes));
  //   }
  // }

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
