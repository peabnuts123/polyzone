import { Quaternion } from '@polyzone/core/util';
import { ScriptComponent } from '@polyzone/core/world';

/**
 * Absolute Rotation Demo
 * Object that is always oriented the same.
 */
export default class AbsoluteRotationFixedAngleObject extends ScriptComponent {
  public override onUpdate(_deltaTime: number): void {
    this.gameObject.transform.absoluteRotation = Quaternion.identity();
  }
}
