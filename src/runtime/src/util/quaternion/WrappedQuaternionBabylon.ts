import { Quaternion as QuaternionBabylon } from '@babylonjs/core/Maths/math.vector';
import { Quaternion as QuaternionCore } from '@polyzone/core/src/util/Quaternion';
import { toQuaternionBabylon } from '@polyzone/runtime/src/util/quaternion';

/**
 * A Quaternion that is implemented around wrapping a Babylon Quaternion internally.
 */
export class WrappedQuaternionBabylon extends QuaternionCore {
  /**
   * A function that can access the quaternion that is being wrapped.
   */
  private readonly getValue: () => QuaternionBabylon;
  /**
   * A function that can set the value of the quaternion being wrapped.
   */
  private readonly _setValue: (value: QuaternionBabylon) => void;

  // @TODO Optimised versions of functions from `QuaternionCore`

  public constructor(getValue: () => QuaternionBabylon, setValue: (value: QuaternionBabylon) => void) {
    const quat = getValue();
    super(quat.x, quat.y, quat.z, quat.w);
    this.getValue = getValue;
    this._setValue = setValue;
  }

  public override get x(): number { return this.getValue().x; }
  public override set x(value: number) {
    const q = this.getValue();
    this._setValue(new QuaternionBabylon(
      value,
      q.y,
      q.z,
      q.w,
    ));
  }

  public override get y(): number { return this.getValue().y; }
  public override set y(value: number) {
    const q = this.getValue();
    this._setValue(new QuaternionBabylon(
      q.x,
      value,
      q.z,
      q.w,
    ));
  }

  public override get z(): number { return this.getValue().z; }
  public override set z(value: number) {
    const q = this.getValue();
    this._setValue(new QuaternionBabylon(
      q.x,
      q.y,
      value,
      q.w,
    ));
  }

  public override get w(): number { return this.getValue().w; }
  public override set w(value: number) {
    const q = this.getValue();
    this._setValue(new QuaternionBabylon(
      q.x,
      q.y,
      q.z,
      value,
    ));
  }

  public override setValue(value: QuaternionCore): void {
    this._setValue(toQuaternionBabylon(value));
  }
}
