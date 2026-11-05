import { CameraNode, SceneNode } from '@lopoly/engine/scene';
import { CameraComponent as CameraComponentCore } from '@polyzone/core/objects/components';
import { Vector3 } from '@polyzone/core/math';
import { CameraComponentData } from '@polyzone/runtime/cartridge/data';
import { GameObject } from '@polyzone/runtime/objects/GameObject';
import { IGameObjectComponent } from './IGameObjectComponent';

const DebugFov = 45; // @TODO from data

export class CameraComponent extends CameraComponentCore implements IGameObjectComponent {
  public readonly id: string;
  public readonly gameObject: GameObject;
  private readonly cameraNode: CameraNode;

  public constructor(id: string, gameObject: GameObject, cameraNode: CameraNode) {
    super();
    this.id = id;
    this.cameraNode = cameraNode;
    this.gameObject = gameObject;
  }

  public init(): void { }
  public onUpdate(): void { }
  public onDestroy(): void {
    this.sceneNode.destroy();
  }

  public pointAt(target: Vector3): void {
    this.cameraNode.pointAt(target);
  }

  public static instantiateFromData(data: CameraComponentData, gameObject: GameObject, atIndex: number | undefined): Promise<CameraComponent> {
    return gameObject.registerComponentInstance((componentParentSceneNode) => {
      const cameraNode = new CameraNode(gameObject.scene.lopolyScene, `Camera:${data.id}`, DebugFov, componentParentSceneNode);
      const cameraComponent = new CameraComponent(data.id, gameObject, cameraNode);
      return cameraComponent;
    }, atIndex);
  }

  public get sceneNode(): SceneNode { return this.cameraNode; }
}
