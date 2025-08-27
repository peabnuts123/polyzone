import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';

import {
  Transform as TransformRuntime,
  GameObject as GameObjectRuntime,
} from '@polyzone/runtime/src/world';
import { GameObjectComponent } from '@polyzone/core/src/world/GameObjectComponent';
import { createGameObject } from '@polyzone/runtime/src/world/createGameObject';

import { createEditorGameObjectComponent } from '@lib/common/GameObjects';
import { ISelectableObject } from "@lib/composer/scene";
import { ISceneViewController } from "@lib/composer/scene/SceneViewController";
import { CurrentSelectionTool, SelectionManager } from "@lib/composer/scene/SelectionManager";
import { SceneDefinition } from "@lib/project";
import { GameObjectData, IComposerComponentData, SceneData } from "@lib/project/data";
import { SceneDbRecord } from "@lib/project/data/SceneDb";
import { JsoncContainer } from "@lib/util/JsoncContainer";
import { Func } from '@lib/util/types';
import { MutationController } from '@lib/mutation/MutationController';

import { MockProjectController } from "../project/MockProjectController";
import { MockSceneViewMutator, MockSceneViewMutatorNew } from "./MockSceneViewMutator";


/**
 * Mock version of `SceneViewController` that just houses state, and otherwise contains no logic.
 */
export class MockSceneViewController implements ISceneViewController {
  private projectController: MockProjectController;
  public canvas: HTMLCanvasElement;
  public scene: SceneData;
  public babylonScene: BabylonScene;
  public sceneJson: JsoncContainer<SceneDefinition>;
  public mutationController: MutationController;
  public mutator: MockSceneViewMutator;
  public mutatorNew: MockSceneViewMutatorNew;
  public selectionManager: SelectionManager;
  public gameObjectInstances: GameObjectRuntime[];

  private constructor(
    projectController: MockProjectController,
    canvas: HTMLCanvasElement,
    babylonScene: BabylonScene,
    scene: SceneData,
    sceneJson: JsoncContainer<SceneDefinition>,
  ) {
    this.projectController = projectController;
    this.canvas = canvas;
    this.scene = scene;
    this.sceneJson = sceneJson;
    this.babylonScene = babylonScene;
    this.mutationController = new MutationController();
    this.mutator = new MockSceneViewMutator(this, projectController);
    this.mutatorNew = new MockSceneViewMutatorNew(this, projectController, this.mutationController);
    this.selectionManager = new SelectionManager(this.babylonScene, this);
    this.gameObjectInstances = [];
  }

  public static async create(projectController: MockProjectController, scene: SceneDbRecord): Promise<MockSceneViewController> {
    const canvas = document.createElement('canvas');
    const babylonEngine = new Engine(canvas);
    const babylonScene = new BabylonScene(babylonEngine);

    const sceneViewController = new MockSceneViewController(
      projectController,
      canvas,
      babylonScene,
      scene.data,
      scene.jsonc,
    );

    await sceneViewController.createScene();

    return sceneViewController;
  }

  private async createScene(): Promise<void> {
    await Promise.all(
      this.scene.objects.map((sceneObject) =>
        this.createGameObject(sceneObject),
      ),
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
  createGameObject: (gameObjectData: GameObjectData, parentTransform?: TransformRuntime) => Promise<GameObjectRuntime> = async (gameObjectData, parentTransform) => {
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
  findGameObjectById: (gameObjectId: string) => GameObjectRuntime | undefined = (gameObjectId) => {
    return this.gameObjectInstances.find((gameObject) => gameObject.id === gameObjectId);
  };
  addGameObject: (gameObject: GameObjectRuntime) => void = (gameObject) => {
    this.gameObjectInstances.push(gameObject);
  };
  removeGameObject: (gameObject: GameObjectRuntime) => void = (gameObject) => {
    const index = this.gameObjectInstances.findIndex((existingGameObject) => existingGameObject.id === gameObject.id);
    if (index !== -1) {
      this.gameObjectInstances.splice(index, 1);
    }
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
