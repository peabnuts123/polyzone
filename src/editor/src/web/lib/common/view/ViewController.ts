import { Vector3 } from "@polyzone/core/math";

import { MutationController } from "@lib/mutation/MutationController";
import { Mutator } from "@lib/mutation/Mutator";
import { MutatorNew } from "@lib/mutation/MutatorNew";
import { IProjectController } from "@lib/project/ProjectController";
import { Engine } from "@lopoly/engine";

import { AssetCache } from "@polyzone/runtime/assets";

import { EditorScene } from "@lib/common/scene";
import { ViewCamera } from "./ViewCamera";

export type AnyViewController = IViewController<Mutator<any>, MutatorNew<any>>;

export interface IViewController<TMutator extends Mutator<any>, TMutatorNew extends MutatorNew<any>> {
  get assetCache(): AssetCache;
  get canvas(): HTMLCanvasElement;
  get mutator(): TMutator;
  get mutatorNew(): TMutatorNew;
  startView(): () => void;
  destroy(): void;
}

export class ViewController<TMutator extends Mutator<any>, TMutatorNew extends MutatorNew<any>> implements IViewController<TMutator, TMutatorNew> {
  public readonly engine: Engine;
  public readonly assetCache: AssetCache;
  public readonly canvas: HTMLCanvasElement;
  public readonly mutator: TMutator;
  public readonly mutatorNew: TMutatorNew;
  public readonly scene: EditorScene;
  public readonly camera: ViewCamera;
  private readonly projectController: IProjectController;
  private readonly mutationController: MutationController;

  public constructor(
    projectController: IProjectController,
    mutationController: MutationController,
    mutator: TMutator,
    mutatorNew: TMutatorNew,
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
    this.scene = new EditorScene(this.engine, this.assetCache);

    this.camera = new ViewCamera(this.scene.lopolyScene, "camera:main", 50);
    // @TODO @DEBUG lol
    this.camera.position.setValue(6, -1, 2);
    this.camera.pointAt(Vector3.zero());
  }

  public startView(): () => void {
    this.engine.run();

    const resizeObserver = new ResizeObserver((entries) => {
      // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
      // @TODO `devicePixelContentBoxSize` ?
      const newSize = entries[0].contentRect;
      this.canvas.width = newSize.width * devicePixelRatio;
      this.canvas.height = newSize.height * devicePixelRatio;

    });
    resizeObserver.observe(this.canvas);

    this.mutationController.setMutatorActive(this.mutatorNew, true);

    /* Teardown - when scene view is unloaded */
    const onStopView = (): void => {
      resizeObserver.unobserve(this.canvas);
      this.engine.stop();
      this.mutationController.setMutatorActive(this.mutatorNew, false);
    };
    return onStopView;
  }

  public destroy(): void {
    this.projectController.unregisterViewController(this);
    this.scene.destroy();
  }
}
