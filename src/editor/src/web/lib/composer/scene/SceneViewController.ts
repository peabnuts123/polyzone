import { makeAutoObservable } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { FreeCamera as FreeCameraBabylon } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight as HemisphericLightBabylon } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import "@babylonjs/loaders/OBJ/objFileLoader";
import "@babylonjs/loaders/glTF";
import { PointLight as PointLightBabylon } from '@babylonjs/core/Lights/pointLight';
import { DirectionalLight as DirectionalLightBabylon } from '@babylonjs/core/Lights/directionalLight';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import '@babylonjs/core/Culling/ray'; // @NOTE needed for mesh picking - contains side effects

import { GameObjectComponent } from '@polyzone/core/src/world';
import {
  Transform as TransformRuntime,
  GameObject as GameObjectRuntime,
  DirectionalLightComponent as DirectionalLightComponentRuntime,
  PointLightComponent as PointLightComponentRuntime,
} from '@polyzone/runtime/src/world';
import { toColor3Babylon } from '@polyzone/runtime/src/util';
import { MeshAsset, AssetCache } from '@polyzone/runtime/src/world/assets';

import { JsoncContainer } from '@lib/util/JsoncContainer';
import { ProjectController } from '@lib/project/ProjectController';
import { SceneViewMutator } from '@lib/mutation/SceneView';
import { SceneDefinition } from '@lib/project/definition';
import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from '@lib/project/data/components';
import { SceneData, GameObjectData, AssetData } from '@lib/project/data';
import { ProjectSceneEventType } from '@lib/project/watcher/scenes';
import { ProjectFileEventType } from '@lib/project/watcher/project';
import { SceneDbRecord } from '@lib/project/data/SceneDb';
import { ComposerSelectionCache } from '../util/ComposerSelectionCache';
import { isAssetDependentComponent, ISelectableObject, isSelectableObject, MeshComponent } from './components';
import { CurrentSelectionTool, SelectionManager } from './SelectionManager';
import { AssetDependencyCache } from './AssetDependencyCache';

export class SceneViewController {
  private _scene: SceneData;
  private _sceneJson: JsoncContainer<SceneDefinition>;
  private readonly projectController: ProjectController;
  private readonly _mutator: SceneViewMutator;

  private readonly _canvas: HTMLCanvasElement;
  private readonly engine: Engine;
  private readonly babylonScene: BabylonScene;
  private sceneCamera!: FreeCameraBabylon;
  private readonly assetDependencyCache: AssetDependencyCache;
  private readonly assetCache: AssetCache;
  private readonly _selectionManager: SelectionManager;
  private readonly babylonToWorldSelectionCache: ComposerSelectionCache;
  private readonly unlistenToFileSystemEvents: () => void;

  public constructor(scene: SceneData, sceneJson: JsoncContainer<SceneDefinition>, projectController: ProjectController) {
    this._scene = scene;
    this._sceneJson = sceneJson;
    this.projectController = projectController;
    this.assetCache = new AssetCache();
    this.assetDependencyCache = new AssetDependencyCache(this, projectController.filesWatcher);
    this.babylonToWorldSelectionCache = new ComposerSelectionCache();
    this._mutator = new SceneViewMutator(
      this,
      projectController,
    );

    this._canvas = document.createElement('canvas');
    this.canvas.classList.add('w-full', 'h-full');

    this.engine = new Engine(this.canvas, true, {}, true);
    this.babylonScene = new BabylonScene(this.engine);
    this._selectionManager = new SelectionManager(this.babylonScene, this.mutator);

    // Build scene
    void this.buildScene();

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

    this.unlistenToFileSystemEvents = () => {
      stopListeningToProjectFileEvents();
      stopListeningToSceneFileEvents();
    };

    makeAutoObservable(this);
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
          // Resolve GameObjectData from reverse lookup cache
          const pickedGameObject = this.babylonToWorldSelectionCache.get(pointerInfo.pickInfo.pickedMesh);

          if (pickedGameObject === undefined) {
            console.error(`Picked mesh but found no corresponding GameObject in cache. Has it been populated or updated? Picked mesh:`, pointerInfo.pickInfo.pickedMesh);
          } else {
            this.selectionManager.select(pickedGameObject);
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
    this.assetCache.onDestroy();
    this.assetDependencyCache.onDestroy();
    this.selectionManager.destroy();
    this.babylonScene.onPointerObservable.clear();
    this.babylonScene.dispose();
    this.engine.dispose();
    this.unlistenToFileSystemEvents();
    this._canvas.remove();
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

    // @TODO store this in a World or something
    //  - remove need for `sceneInstance`
    //  - call `destroy` on the objects, lol
    const _gameObjects = await Promise.all(
      this.scene.objects.map((sceneObject) =>
        this.createGameObject(sceneObject),
      ));
  }

  public setCurrentTool(tool: CurrentSelectionTool): void {
    this.selectionManager.currentTool = tool;
  }

  public addToSelectionCache(gameObjectData: GameObjectData, component: ISelectableObject): void {
    this.babylonToWorldSelectionCache.add(gameObjectData, component.allSelectableMeshes);
  }

  public removeFromSelectionCache(component: ISelectableObject): void {
    this.babylonToWorldSelectionCache.remove(component.allSelectableMeshes);
  }

  // @TODO we probably should try to share this with the runtime in some kind of overridable fashion (?)
  public async createGameObject(gameObjectData: GameObjectData, parentTransform: TransformRuntime | undefined = undefined): Promise<GameObjectRuntime> {
    console.log(`[SceneViewController] (createSceneObject) Loading scene object: `, gameObjectData.name);
    // Construct game object transform for constructing scene's hierarchy
    const transform = new TransformRuntime(
      gameObjectData.name,
      this.babylonScene!,
      parentTransform,
      gameObjectData.transform,
    );

    // Create all child objects first
    await Promise.all(gameObjectData.children.map((childObjectData) => this.createGameObject(childObjectData, transform)));

    // Create blank object
    const gameObject = new GameObjectRuntime(
      gameObjectData.id,
      gameObjectData.name,
      transform,
    );

    transform.gameObject = gameObject;

    // Store reverse reference to new instance
    // @TODO nah I actually don't know if I wanna do this
    gameObjectData.sceneInstance = gameObject;

    // Load game object components
    await Promise.all(gameObjectData.components.map((componentData) =>
      this.createGameObjectComponent(gameObjectData, gameObject, componentData),
    ));

    return gameObject;
  }

  public async createGameObjectComponent(gameObjectData: GameObjectData, gameObject: GameObjectRuntime, componentData: IComposerComponentData): Promise<GameObjectComponent | undefined> {
    let newComponent: GameObjectComponent | undefined = undefined;

    if (componentData instanceof MeshComponentData) {
      /* Mesh component */
      let meshAsset: MeshAsset | undefined = undefined;
      if (componentData.meshAsset !== undefined) {
        meshAsset = await this.assetCache.loadAsset(componentData.meshAsset, { scene: this.babylonScene, assetDb: this.projectController.project.assets });
      }
      const meshComponent = newComponent = new MeshComponent(componentData, gameObject, meshAsset);
      // Store reverse reference to new instance for managing instance later (e.g. autoload)
      componentData.componentInstance = meshComponent;
    } else if (componentData instanceof ScriptComponentData) {
      /* @NOTE Script has no effect in the Composer */
    } else if (componentData instanceof CameraComponentData) {
      /* @NOTE Camera has no effect in the Composer */
    } else if (componentData instanceof DirectionalLightComponentData) {
      /* Directional Light component */
      const light = new DirectionalLightBabylon(`light_directional`, Vector3Babylon.Down(), this.babylonScene);
      light.specular = Color3Babylon.Black();
      light.intensity = componentData.intensity;
      light.diffuse = toColor3Babylon(componentData.color);
      newComponent = new DirectionalLightComponentRuntime(componentData.id, gameObject, light);
    } else if (componentData instanceof PointLightComponentData) {
      /* Point Light component */
      const light = new PointLightBabylon(`light_point`, Vector3Babylon.Zero(), this.babylonScene);
      light.specular = Color3Babylon.Black();
      light.intensity = componentData.intensity;
      light.diffuse = toColor3Babylon(componentData.color);
      newComponent = new PointLightComponentRuntime(componentData.id, gameObject, light);
    } else {
      console.error(`[SceneViewController] (createGameObjectComponent) Unrecognised component data: `, componentData);
    }

    // Only continue processing if a component was actually made
    if (newComponent === undefined) return;

    // Store selectable objects in cache (for efficient lookup of model => game object on click)
    if (isSelectableObject(newComponent)) {
      this.addToSelectionCache(gameObjectData, newComponent);
    }

    // Store asset dependencies in a cache (for reloading components when assets change)
    if (isAssetDependentComponent(newComponent)) {
      this.assetDependencyCache.registerDependency(newComponent.assetDependencyIds, newComponent, gameObjectData);
    }

    gameObject.addComponent(newComponent);
  }

  /**
   * Reload the instance of a component from its definition for an object loaded in the scene view.
   * @param componentInstance Current instance of the component. This instance will be destroyed.
   * @param gameObjectData GameObject on which this component lives
   */
  public async reinitializeComponentInstance(componentInstance: GameObjectComponent, gameObjectData: GameObjectData): Promise<void> {
    const gameObjectInstance = componentInstance.gameObject as GameObjectRuntime;
    const componentData = gameObjectData.components.find((component) => component.id === componentInstance.id);
    if (componentData === undefined) throw new Error(`Cannot reinitialize component. Component with ID '${componentInstance.id}' is not a component of GameObject with ID '${gameObjectData.id}'`);

    // Remove selectable components from selection cache
    if (isSelectableObject(componentInstance)) {
      this.removeFromSelectionCache(componentInstance);
    }

    // Remove registered asset dependency (since component instance is about to be destroyed)
    if (isAssetDependentComponent(componentInstance)) {
      this.assetDependencyCache.unregisterDependency(componentInstance);
    }

    // Remove (and destroy) component instance
    gameObjectInstance.removeComponent(componentInstance.id);

    // Re-create component instance
    await this.createGameObjectComponent(gameObjectData, gameObjectInstance, componentData);
  }

  public async reloadSceneData(scene: SceneDbRecord): Promise<void> {
    // Clear out the scene
    this.selectionManager.deselectAll();
    this.babylonToWorldSelectionCache.clear();
    this.assetCache.clear();
    this.assetDependencyCache.clear();

    const rootNodes = [...this.babylonScene.rootNodes];
    for (const sceneObject of rootNodes) {
      if (sceneObject !== this.sceneCamera) {
        sceneObject.dispose(false, true);
      }
    }
    // @TODO Do we need to explicitly iterate through, like, materials and textures and stuff?
    // We could just create a new scene and put the camera back in the same place ...

    // Update data
    this._scene = scene.data;
    this._sceneJson = scene.jsonc;

    await this.createScene();
  }

  public invalidateAssetCache(assetData: AssetData): void {
    this.assetCache.delete(assetData);
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

  public get selectedObject(): GameObjectData | undefined {
    return this.selectionManager.selectedObject;
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager!;
  }
}
