import { Vector3 } from '@polyzone/core/util';
import { ScriptComponent } from '@polyzone/core/world';

/**
 * Absolute Scale Demo
 * Object that is always its original size.
 */
export default class AbsoluteScaleDemoFixedSizeObject extends ScriptComponent {
  public override onUpdate(_deltaTime: number): void {
    this.gameObject.transform.absoluteScale = Vector3.one().multiply(0.25 * 0.4);
  }
}
