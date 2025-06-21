import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";

import { CameraComponent as CameraComponentCore } from "@polyzone/core/src/world/components";
import { Quaternion, Vector3 } from "@polyzone/core/src/util";

import { GameObject } from "../GameObject";


export class CameraComponent extends CameraComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  private camera: FreeCamera;

  public constructor(id: string, gameObject: GameObject, camera: FreeCamera) {
    super();
    this.id = id;
    this.gameObject = gameObject;

    this.camera = camera;
    camera.parent = this.gameObject.transform.node;
  }

  public pointAt(target: Vector3): void {
    const direction = target.subtract(this.gameObject.transform.absolutePosition).normalize();

    // @NOTE Set the rotation of the GameObject itself
    // @TODO should not use Babylon interface
    this.gameObject.transform.absoluteRotation = Quaternion.fromEuler(
      Math.atan2(-direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
      Math.atan2(direction.x, direction.z),
      0,
    );
  }

  public override onDestroy(): void {
    this.camera.dispose();
  }
}
