import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';

import { AnyVector } from '@polyzone/core/src';
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
    super(0, 0, 0); // @NOTE Super values NOT used
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

  /*
   * =====================================================
   * Optimised versions of Vector3 functions to perform
   * operations efficiently without thrashing get/setValue
   * =====================================================
   */

  public override addSelf(value: AnyVector): Vector3Core {
    const currentValue = this.getValue();
    this._setValue(new Vector3Babylon(
      currentValue.x + value.x,
      currentValue.y + value.y,
      currentValue.z + ('z' in value ? value.z : 0),
    ));
    return this;
  }
  public override add(value: AnyVector): Vector3Core {
    const currentValue = this.getValue();
    return new Vector3Core(
      currentValue.x + value.x,
      currentValue.y + value.y,
      currentValue.z + ('z' in value ? value.z : 0),
    );
  }

  public override subtractSelf(value: AnyVector): Vector3Core {
    const currentValue = this.getValue();
    this._setValue(new Vector3Babylon(
      currentValue.x - value.x,
      currentValue.y - value.y,
      currentValue.z - ('z' in value ? value.z : 0),
    ));
    return this;
  }
  public override subtract(value: AnyVector): Vector3Core {
    const currentValue = this.getValue();
    return new Vector3Core(
      currentValue.x - value.x,
      currentValue.y - value.y,
      currentValue.z - ('z' in value ? value.z : 0),
    );
  }

  public override multiplySelf(factor: number): Vector3Core;
  public override multiplySelf(other: Vector3Core): Vector3Core;
  public override multiplySelf(operand: number | Vector3Core): Vector3Core {
    const currentValue = this.getValue();
    if (operand instanceof Vector3Core) {
      this._setValue(new Vector3Babylon(
        currentValue.x * operand.x,
        currentValue.y * operand.y,
        currentValue.z * operand.z,
      ));
    } else {
      this._setValue(new Vector3Babylon(
        currentValue.x * operand,
        currentValue.y * operand,
        currentValue.z * operand,
      ));
    }
    return this;
  }
  public override multiply(factor: number): Vector3Core;
  public override multiply(other: Vector3Core): Vector3Core;
  public override multiply(operand: number | Vector3Core): Vector3Core {
    const currentValue = this.getValue();
    if (operand instanceof Vector3Core) {
      return new Vector3Core(
        currentValue.x * operand.x,
        currentValue.y * operand.y,
        currentValue.z * operand.z,
      );
    } else {
      return new Vector3Core(
        currentValue.x * operand,
        currentValue.y * operand,
        currentValue.z * operand,
      );
    }
  }

  public override divideSelf(factor: number): Vector3Core;
  public override divideSelf(other: Vector3Core): Vector3Core;
  public override divideSelf(operand: number | Vector3Core): Vector3Core {
    if (operand instanceof Vector3Core) {
      if (operand.x === 0 || operand.y === 0 || operand.z === 0) {
        throw new Error(`Cannot divide Vector3 by 0: ${operand}`);
      }
      const currentValue = this.getValue();
      this._setValue(new Vector3Babylon(
        currentValue.x / operand.x,
        currentValue.y / operand.y,
        currentValue.z / operand.z,
      ));
    } else {
      if (operand === 0) {
        throw new Error(`Cannot divide Vector3 by 0`);
      }
      const currentValue = this.getValue();
      this._setValue(new Vector3Babylon(
        currentValue.x / operand,
        currentValue.y / operand,
        currentValue.z / operand,
      ));
    }
    return this;
  }

  public override divide(factor: number): Vector3Core;
  public override divide(other: Vector3Core): Vector3Core;
  public override divide(operand: number | Vector3Core): Vector3Core {
    if (operand instanceof Vector3Core) {
      if (operand.x === 0 || operand.y === 0 || operand.z === 0) {
        throw new Error(`Cannot divide Vector3 by 0: ${operand}`);
      }
      const currentValue = this.getValue();
      return new Vector3Core(
        currentValue.x / operand.x,
        currentValue.y / operand.y,
        currentValue.z / operand.z,
      );
    } else {
      if (operand === 0) {
        throw new Error(`Cannot divide Vector3 by 0`);
      }
      const currentValue = this.getValue();
      return new Vector3Core(
        currentValue.x / operand,
        currentValue.y / operand,
        currentValue.z / operand,
      );
    }
  }

  public override length(): number {
    const currentValue = this.getValue();
    return Math.sqrt(currentValue.x * currentValue.x + currentValue.y * currentValue.y + currentValue.z * currentValue.z);
  }

  public override normalizeSelf(): Vector3Core {
    const currentValue = this.getValue();
    const length = currentValue.length();
    if (length === 0) {
      this._setValue(new Vector3Babylon(0, 0, 0));
    } else {
      this._setValue(new Vector3Babylon(
        currentValue.x / length,
        currentValue.y / length,
        currentValue.z / length,
      ));
    }
    return this;
  }
  public override normalize(): Vector3Core {
    const currentValue = this.getValue();
    const length = currentValue.length();
    if (length === 0) {
      return new Vector3Core(0, 0, 0);
    } else {
      return new Vector3Core(
        currentValue.x / length,
        currentValue.y / length,
        currentValue.z / length,
      );
    }
  }
  public override clone(): Vector3Core {
    const currentValue = this.getValue();
    return new Vector3Core(
      currentValue.x,
      currentValue.y,
      currentValue.z,
    );
  }

  public override withX(value: number): Vector3Core {
    const currentValue = this.getValue();
    return new Vector3Core(
      value,
      currentValue.y,
      currentValue.z,
    );
  }
  public override withY(value: number): Vector3Core {
    const currentValue = this.getValue();
    return new Vector3Core(
      currentValue.x,
      value,
      currentValue.z,
    );
  }
  public override withZ(value: number): Vector3Core {
    const currentValue = this.getValue();
    return new Vector3Core(
      currentValue.x,
      currentValue.y,
      value,
    );
  }
  public override toString(): string {
    const currentValue = this.getValue();
    return `Vector3(${currentValue.x}, ${currentValue.y}, ${currentValue.z})`;
  }
}
