import { Vector3 } from '@polyzone/core/util';
import { ScriptComponent } from '@polyzone/core/world';

const ThrobPeriodSeconds = 3.0;
const TimeToRadians = Math.PI * 2 / ThrobPeriodSeconds;

const MaxScale = 1.4 * 0.25;
const MinScale = 0.2 * 0.25;

/**
 * Absolute Scale Demo
 * Object whose size changes up/down over time.
 */
export default class AbsoluteScaleDemoThrobbingObject extends ScriptComponent {
  private time: number = 0;

  public override onUpdate(deltaTime: number): void {
    this.gameObject.transform.localScale = Vector3.one()
      .multiply(
        (Math.sin(this.time * TimeToRadians) + 1) / 2 * (MaxScale - MinScale) + MinScale,
      );

    this.time += deltaTime;
  }
}
