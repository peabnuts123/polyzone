import { Vector3 } from '@polyzone/core/util';
import { ScriptComponent } from '@polyzone/core/world';

const SpinPeriodSeconds = 3;

/**
 * Absolute Rotation Demo
 * Object who is turning.
 */
export default class AbsoluteRotationSpinningObject extends ScriptComponent {
  public override onUpdate(deltaTime: number): void {
    const yawDelta = deltaTime / SpinPeriodSeconds * Math.PI * 2;
    this.gameObject.transform.rotate(
      new Vector3(
        0,
        yawDelta,
        0,
      ),
    );
  }
}
