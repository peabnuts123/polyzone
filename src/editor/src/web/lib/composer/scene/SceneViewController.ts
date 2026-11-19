import { makeAutoObservable } from 'mobx';
import { GamepadAxis, KeyCode, GamepadButton, MouseButton, PointerState } from '@lopoly/engine/input';
import { IEngine } from '@lopoly/engine/Engine';
import { Scene as LoPolyScene } from '@lopoly/engine/scene';
import { RayCast, RayCastMode } from '@lopoly/engine/collision';

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
import { MutationController } from '@lib/mutation/MutationController';
import { IViewController, ViewCamera, ViewController } from '@lib/common/view';
import { IComposerComponentData } from '@lib/project/data/components';
import { EditorScene } from '@lib/common/scene';
import { EditorObject } from '@lib/common/objects';

import { isAssetDependentComponent, isSelectableObject } from './components';
import { CurrentSelectionTool, SelectionManager, SelectionManagerResources } from './SelectionManager';


export interface ISceneViewController extends IViewController<SceneViewMutator, SceneViewMutatorNew> {
  setCurrentTool(tool: CurrentSelectionTool): void;
  focusSelected(): void;
  reinitializeComponentInstance(componentData: IComposerComponentData, objectData: GameObjectData): Promise<void>;
  reloadSceneData(scene: SceneDbRecord): Promise<void>;
  findEditorObjectById(objectId: string): EditorObject | undefined;

  get scene(): EditorScene;
  get sceneData(): SceneData;
  get sceneJson(): JsoncContainer<SceneDefinition>;
  get sceneDefinition(): SceneDefinition;
  get selectedObject(): EditorObject | undefined
  get selectedObjectData(): GameObjectData | undefined;
  get selectedObjectId(): string | undefined;
  get selectionManager(): SelectionManager;
  get camera(): ViewCamera;
}

export class SceneViewController implements ISceneViewController {
  private readonly _selectionManager: SelectionManager;
  private readonly unlistenToFileSystemEvents: () => void;

  private _sceneData: SceneData;
  private _sceneJson: JsoncContainer<SceneDefinition>;
  private readonly viewController: ViewController<SceneViewMutator, SceneViewMutatorNew>;

  private constructor(
    sceneData: SceneData,
    sceneJson: JsoncContainer<SceneDefinition>,
    projectController: IProjectController,
    mutationController: MutationController,
    selectionManagerResources: SelectionManagerResources,
  ) {
    this._sceneData = sceneData;
    this._sceneJson = sceneJson;
    this.viewController = new ViewController(
      projectController,
      mutationController,
      new SceneViewMutator(this, projectController),
      new SceneViewMutatorNew(this, projectController, mutationController),
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
          const allAffectedComponentData = this.scene.componentDependencyManager.getAllDependentsForAssetIds(allAffectedAssets);

          // Reinitialise all affected components
          for (const { componentData, objectData, assetIds } of allAffectedComponentData) {
            if (assetIds.includes(event.asset.id)) {
              console.log(`[DEBUG] [SceneViewController] (filesWatcher.onAssetChanged) Reinitializing component due to asset change: (assetId='${event.asset.id}') (componentId='${componentData.id}') (objectId='${objectData.id}')`);
            } else {
              console.log(`[DEBUG] [SceneViewController] (filesWatcher.onAssetChanged) Reinitializing component due to TRANSITIVE asset change: (source assetId='${event.asset.id}') (componentId='${componentData.id}') (objectId='${objectData.id}')`);
            }

            void this.reinitializeComponentInstance(componentData, objectData);
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
    await sceneViewController.createScene();
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

  private onClickSelect(pointer: PointerState): void {
    if (pointer.x !== undefined && pointer.y !== undefined) {
      this.camera.rayCastFromCamera(pointer.x, pointer.y, (rayOrigin, rayDirection) => {
        const result = RayCast.scene(rayOrigin, rayDirection, this.lopolyScene, RayCastMode.Infinite);
        const pickedModel = result?.target;
        if (pickedModel !== undefined) {
          const pickedGameObjectId = this.scene.selectionCache.get(pickedModel);
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
        this.scene.createEditorObject(sceneObject),
      ),
    );

    // @TODO Delete lighting intensity
    this.scene.lighting.ambientColor = this.sceneData.config.lighting.ambient.color.scaleSelf(this.sceneData.config.lighting.ambient.intensity);
    this.scene.clearColour = this.sceneData.config.clearColor;
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

  /**
   * Reload the instance of a component from its definition for an object loaded in the scene view.
   * @param componentData Data for object component. The previous instance of this component will be destroyed.
   * @param objectData Data for the object on which this component lives
   */
  public async reinitializeComponentInstance(componentData: IComposerComponentData, objectData: GameObjectData): Promise<void> {
    const objectInstance = this.findEditorObjectById(objectData.id);
    if (objectInstance === undefined) throw new Error(`Cannot reinitialize component. No object with id '${objectData.id}' could be found in the scene`);
    const componentIndex = objectInstance.components.findIndex((component) => component.id === componentData.id);
    if (componentIndex === undefined) throw new Error(`Cannot reinitialize component. Component with ID '${componentData.id}' is not a component of object with ID '${objectData.id}'`);

    const componentInstance = objectInstance.components[componentIndex];

    // Remove selectable components from selection cache
    if (isSelectableObject(componentInstance)) {
      this.scene.removeFromSelectionCache(componentInstance);
    }

    // Remove registered asset dependency (since component instance is about to be destroyed)
    if (isAssetDependentComponent(componentInstance)) {
      this.scene.componentDependencyManager.unregisterDependency(componentInstance.id);
    }

    // Remove (and destroy) component instance
    objectInstance.removeComponent(componentInstance.id);

    // Re-create component instance
    await this.scene.createEditorObjectComponent(componentData, objectInstance, objectData, componentIndex);
  }

  public async reloadSceneData(scene: SceneDbRecord): Promise<void> {
    // Clear out the scene
    this.selectionManager.deselectAll();
    this.scene.clear();

    // Update scene data
    this._sceneData = scene.data;
    this._sceneJson = scene.jsonc;

    await this.createScene();
  }

  public findEditorObjectById(objectId: string): EditorObject | undefined {
    return this.scene.findEditorObjectById(objectId);
  }

  /* IViewController implementation through encapsulated object */
  public startView(): () => void { return this.viewController.startView(); }
  public get canvas(): HTMLCanvasElement { return this.viewController.canvas; }
  public get assetCache(): AssetCache { return this.viewController.assetCache; }
  public get mutator(): SceneViewMutator { return this.viewController.mutator; }
  public get mutatorNew(): SceneViewMutatorNew { return this.viewController.mutatorNew; }
  private get engine(): IEngine { return this.viewController.engine; }
  public get scene(): EditorScene { return this.viewController.scene; }
  private get lopolyScene(): LoPolyScene { return this.scene.lopolyScene; }

  public get sceneData(): SceneData { return this._sceneData; }
  public get sceneJson(): JsoncContainer<SceneDefinition> { return this._sceneJson; }
  public get sceneDefinition(): SceneDefinition { return this._sceneJson.value; }

  public get selectedObject(): EditorObject | undefined {
    if (this.selectedObjectId) {
      return this.findEditorObjectById(this.selectedObjectId);
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
