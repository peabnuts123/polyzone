import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';

import { Vector3 as Vector3Core } from '@polyzone/core/src/util/Vector3';
import { toVector3Babylon } from '@polyzone/runtime/src/util/vector';

/**
* A Vector3 that is implemented around wrapping a Babylon Vector3 internally.
*/
export class WrappedVector3Babylon extends Vector3Core {
  /**
   * A function that can access the vector that is being wrapped.
   */
  private readonly getValue: () => Vector3Babylon;
  /**
   * A function that can set the value of the vector being wrapped.
   */
  private readonly _setValue: (value: Vector3Babylon) => void;

  public constructor(getValue: () => Vector3Babylon, setValue: (value: Vector3Babylon) => void) {
    const vector = getValue();
    super(vector.x, vector.y, vector.z);
    this.getValue = getValue;
    this._setValue = setValue;
  }

  public override get x(): number { return this.getValue().x; }
  public override set x(value: number) {
    const vector = this.getValue();
    this._setValue(new Vector3Babylon(
      value,
      vector.y,
      vector.z,
    ));
  }

  public override get y(): number { return this.getValue().y; }
  public override set y(value: number) {
    const vector = this.getValue();
    this._setValue(new Vector3Babylon(
      vector.x,
      value,
      vector.z,
    ));
  }

  public override get z(): number { return this.getValue().z; }
  public override set z(value: number) {
    const vector = this.getValue();
    this._setValue(new Vector3Babylon(
      vector.x,
      vector.y,
      value,
    ));
  }

  public override setValue(value: Vector3Core): void {
    this._setValue(toVector3Babylon(value));
  }
}
