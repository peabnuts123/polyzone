import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { ISelectableObject } from "@lib/composer/scene";
import { ISceneViewController } from "@lib/composer/scene/SceneViewController";
import { CurrentSelectionTool, SelectionManager } from "@lib/composer/scene/SelectionManager";
import { SceneDefinition } from "@lib/project";
import { GameObjectData, IComposerComponentData, SceneData } from "@lib/project/data";
import { SceneDbRecord } from "@lib/project/data/SceneDb";
import { JsoncContainer } from "@lib/util/JsoncContainer";
import { MockProjectController } from "../project/MockProjectController";
import { MockSceneViewMutator } from "./MockSceneViewMutator";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import {
  Transform as TransformRuntime,
  GameObject as GameObjectRuntime,
} from '@polyzone/runtime/src/world';
import { Func } from '@lib/util/types';
import { GameObjectComponent } from '@polyzone/core/src/world/GameObjectComponent';
import { createGameObject } from '@polyzone/runtime/src/world/createGameObject';
import { createEditorGameObjectComponent } from '@lib/common/GameObjects';

/**
 * Mock version of `SceneViewController` that just houses state, and otherwise contains no logic.
 */
export class MockSceneViewController implements ISceneViewController {
  private projectController: MockProjectController;
  public canvas: HTMLCanvasElement;
  public scene: SceneData;
  public babylonScene: BabylonScene;
  public sceneJson: JsoncContainer<SceneDefinition>;
  public mutator: MockSceneViewMutator;
  public selectionManager: SelectionManager;

  private constructor(
    projectController: MockProjectController,
    canvas: HTMLCanvasElement,
    scene: SceneData,
    sceneJson: JsoncContainer<SceneDefinition>,
  ) {
    this.projectController = projectController;
    this.canvas = canvas;
    this.scene = scene;
    this.sceneJson = sceneJson;
    this.mutator = new MockSceneViewMutator(this, projectController);
    const babylonEngine = new NullEngine();
    this.babylonScene = new BabylonScene(babylonEngine);
    this.selectionManager = new SelectionManager(this.babylonScene, this);
  }

  public static create(projectController: MockProjectController, scene: SceneDbRecord): MockSceneViewController {
    const canvas = document.createElement('canvas');

    return new MockSceneViewController(
      projectController,
      canvas,
      scene.data,
      scene.jsonc,
    );
  }

  startBabylonView: Func<Func<void>> = () => {
    return () => { };
  };
  destroy: Func<void> = () => {
    /* No-op */
  };
  setCurrentTool: (tool: CurrentSelectionTool) => void = () => {
    /* No-op */
  };
  addToSelectionCache: (gameObjectId: string, component: ISelectableObject) => void = () => {
    /* No-op */
  };
  removeFromSelectionCache: (component: ISelectableObject) => void = () => {
    /* No-op */
  };
  createGameObject: (gameObjectData: GameObjectData, parentTransform?: TransformRuntime) => Promise<GameObjectRuntime> = (gameObjectData, parentTransform) => {
    return createGameObject(
      gameObjectData,
      parentTransform,
      this.babylonScene,
      (gameObject, componentData) => this.createGameObjectComponent(
        gameObjectData,
        gameObject,
        componentData as IComposerComponentData,
      ),
    );
  };
  createGameObjectComponent: (gameObjectData: GameObjectData, gameObject: GameObjectRuntime, componentData: IComposerComponentData) => Promise<GameObjectComponent | undefined> = (gameObjectData, gameObject, componentData) => {
    return createEditorGameObjectComponent(
      gameObject,
      componentData,
      this.babylonScene,
      this.projectController.assetCache,
      () => { },
      () => { },
    );
  };
  reinitializeComponentInstance: (componentData: IComposerComponentData, gameObjectData: GameObjectData) => Promise<void> = () => {
    return Promise.resolve();
  };
  reloadSceneData: (scene: SceneDbRecord) => Promise<void> = () => {
    return Promise.resolve();
  };
  findGameObjectById: (gameObjectId: string) => GameObjectRuntime | undefined = () => {
    return undefined;
  };
  addGameObject: (gameObject: GameObjectRuntime) => void = () => {
    /* No-op */
  };
  removeGameObject: (gameObject: GameObjectRuntime) => void = () => {
    /* No-op */
  };

  public get sceneDefinition(): SceneDefinition {
    return this.sceneJson.value;
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
}
