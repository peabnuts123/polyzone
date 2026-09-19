import { CameraNode, SceneNode } from '@lopoly/engine/scene';
import { CameraComponent as CameraComponentCore } from '@polyzone/core/objects/components';
import { Vector3 } from '@polyzone/core/math';
import { CameraComponentData } from '@polyzone/runtime/cartridge/data';
import { Scene } from '@polyzone/runtime/scene';
import { GameObject } from '@polyzone/runtime/objects/GameObject';
import { IGameObjectComponent } from './IGameObjectComponent';

const DebugFov = 45; // @TODO from data

export class CameraComponent extends CameraComponentCore implements IGameObjectComponent {
  public readonly id: string;
  public readonly scene: Scene;
  public readonly gameObject: GameObject;
  private readonly cameraNode: CameraNode;

  public constructor(id: string, scene: Scene, gameObject: GameObject, cameraNode: CameraNode) {
    super();
    this.id = id;
    this.scene = scene;
    this.cameraNode = cameraNode;
    this.gameObject = gameObject;
  }

  public pointAt(target: Vector3): void {
    this.cameraNode.pointAt(target);
  }

  public static instantiateFromData(data: CameraComponentData, scene: Scene, gameObject: GameObject): Promise<CameraComponent> {
    return gameObject.registerComponentInstance((componentParentSceneNode) => {
      const cameraNode = new CameraNode(scene.lopolyScene, `Camera:${data.id}`, DebugFov, 4 / 3, componentParentSceneNode);
      const cameraComponent = new CameraComponent(data.id, scene, gameObject, cameraNode);
      return cameraComponent;
    });
  }

  public get sceneNode(): SceneNode { return this.cameraNode; }
}
