import { Vector3, Quaternion } from '@polyzone/core/util';
import { ScriptComponent } from '@polyzone/core/world';

const ROTATE_SPEED_PER_SECOND = -0.7;
const X_ROTATE_SPEED_MODIFIER = 1.0;
const Y_ROTATE_SPEED_MODIFIER = 1.5;
const Z_ROTATE_SPEED_MODIFIER = 0.05;

export default class SpinningModel extends ScriptComponent {

  private time: number = 0;

  public override init(): void {
    this.gameObject.transform.rotate(
      new Vector3(0, 0, Math.PI / 4),
    );
  }

  public override onUpdate(deltaTime: number): void {
    // this.gameObject.transform.localRotation.addSelf(new Vector3(
    //   ROTATE_SPEED_PER_SECOND * X_ROTATE_SPEED_MODIFIER * deltaTime,
    //   ROTATE_SPEED_PER_SECOND * Y_ROTATE_SPEED_MODIFIER * deltaTime,
    //   0,
    // ));

    // this.gameObject.transform.rotate(
    //   new Vector3(
    //     0,
    //     ROTATE_SPEED_PER_SECOND * Y_ROTATE_SPEED_MODIFIER * deltaTime,
    //     0, // ROTATE_SPEED_PER_SECOND * X_ROTATE_SPEED_MODIFIER * deltaTime,
    //   ),
    // );
    this.gameObject.transform.localRotation = Quaternion.fromEuler(
      ROTATE_SPEED_PER_SECOND * X_ROTATE_SPEED_MODIFIER * this.time,
      ROTATE_SPEED_PER_SECOND * Y_ROTATE_SPEED_MODIFIER * this.time,
      ROTATE_SPEED_PER_SECOND * Z_ROTATE_SPEED_MODIFIER * this.time,
    );

    this.time += deltaTime;
  }
}
