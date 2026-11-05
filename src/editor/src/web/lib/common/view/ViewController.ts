import { MutationController } from "@lib/mutation/MutationController";
import { Mutator } from "@lib/mutation/Mutator";
import { MutatorNew } from "@lib/mutation/MutatorNew";
import { SceneData } from "@lib/project/data/SceneData";
import { SceneDefinition } from "@lib/project/definition/scene";
import { IProjectController } from "@lib/project/ProjectController";
import { JsoncContainer } from "@lib/util/JsoncContainer";
import { Engine } from "@lopoly/engine";

import { AssetCache } from "@polyzone/runtime/assets";
import { Scene } from "@polyzone/runtime/scene";
import { ScriptLoader } from "@polyzone/runtime/ScriptLoader";
import { OnClickPressFn, ViewCamera } from "./ViewCamera";
import { Vector3 } from "@polyzone/core/math";

export type AnyViewController = IViewController<Mutator<any>, MutatorNew<any>>;

export interface IViewController<TMutator extends Mutator<any>, TMutatorNew extends MutatorNew<any>> {
  get assetCache(): AssetCache;
  get canvas(): HTMLCanvasElement;
  get mutator(): TMutator;
  get mutatorNew(): TMutatorNew;
  startBabylonView(): () => void;
  destroy(): void;
}

export class ViewController<TMutator extends Mutator<any>, TMutatorNew extends MutatorNew<any>> implements IViewController<TMutator, TMutatorNew> {
  public readonly engine: Engine;
  public readonly assetCache: AssetCache;
  public readonly canvas: HTMLCanvasElement;
  public readonly mutator: TMutator;
  public readonly mutatorNew: TMutatorNew;
  public readonly scene: Scene;
  public readonly camera: ViewCamera;
  private readonly projectController: IProjectController;
  private readonly mutationController: MutationController;

  private _sceneJson: JsoncContainer<SceneDefinition>;
  private _sceneData: SceneData;

  public constructor(
    projectController: IProjectController,
    mutationController: MutationController,
    mutator: TMutator,
    mutatorNew: TMutatorNew,
    sceneData: SceneData,
    sceneJson?: JsoncContainer<SceneDefinition>,
  ) {
    this.projectController = projectController;
    this.mutationController = mutationController;
    this.mutator = mutator;
    this.mutatorNew = mutatorNew;


    this.projectController.registerViewController(this);

    // @TODO Update LoPoly to detach and reattach from different canvases
    this.canvas = document.createElement('canvas');
    this.canvas.tabIndex = 0;
    this.canvas.classList.add('w-full', 'h-full', '[image-rendering:_pixelated]');

    this.engine = new Engine(this.canvas, projectController.fileSystem);
    this.assetCache = new AssetCache(this.engine, projectController.project.assets);
    // @NOTE ScriptLoader not needed by editor. We should restructure something here.
    this.scene = new Scene(sceneData, this.engine, this.assetCache, new ScriptLoader());

    this.camera = new ViewCamera(this.scene.lopolyScene, "camera:main", 50);
    // @TODO @DEBUG lol
    this.camera.position.setValue(6, -1, 2);
    this.camera.pointAt(Vector3.zero());

    this._sceneData = sceneData;
    this._sceneJson = sceneJson ?? new JsoncContainer(JSON.stringify(sceneData));
    this.bindScene(this._sceneData, this._sceneJson);
  }

  // @TODO Rename
  public startBabylonView(): () => void {
    let stopEngine: (() => void) | undefined;
    // let isStopped = false;
    this.engine.run((dt, time, stop) => {
      if (stopEngine === undefined) {
        stopEngine = stop;
      }

      this.scene.onUpdate(dt, time);
      // if (isStopped) {
      //   stop();
      // }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
      // @TODO `devicePixelContentBoxSize` ?
      const newSize = entries[0].contentRect;
      this.canvas.width = newSize.width * devicePixelRatio;
      this.canvas.height = newSize.height * devicePixelRatio;

    });
    resizeObserver.observe(this.canvas as unknown as Element); // @TODO FUCK YOU REACT!!!!!!

    this.mutationController.setMutatorActive(this.mutatorNew, true);

    /* Teardown - when scene view is unloaded */
    const onDestroyView = (): void => {
      resizeObserver.unobserve(this.canvas as unknown as Element); // @TODO FUCK YOU REACT!!!!!!
      if (stopEngine) {
        stopEngine();
      } else {
        console.error(`COULDN'T STOP! - engine has never rendered`);
      }
      this.mutationController.setMutatorActive(this.mutatorNew, false);
    };
    return onDestroyView;
  }

  public bindScene(sceneData: SceneData, sceneJson?: JsoncContainer<SceneDefinition>): void {
    this._sceneData = sceneData;
    this._sceneJson = sceneJson ?? new JsoncContainer(JSON.stringify(sceneData));

    this.scene.lopolyScene.lighting.ambientColor = this.sceneData.config.lighting.ambient.color;
    this.scene.lopolyScene.clearColour = this.sceneData.config.clearColor;
  }

  public destroy(): void {
    this.projectController.unregisterViewController(this);
    this.scene.destroy();
  }

  public get sceneData(): SceneData { return this._sceneData; }
  public get sceneJson(): JsoncContainer<SceneDefinition> { return this._sceneJson; }
}
