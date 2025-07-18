import { Vector3 } from "./Vector3";

export class Quaternion {
  private _x: number;
  private _y: number;
  private _z: number;
  private _w: number;

  public constructor(x: number, y: number, z: number, w: number) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
  }

  public get x(): number { return this._x; }
  public set x(value: number) { this._x = value; }

  public get y(): number { return this._y; }
  public set y(value: number) { this._y = value; }

  public get z(): number { return this._z; }
  public set z(value: number) { this._z = value; }

  public get w(): number { return this._w; }
  public set w(value: number) { this._w = value; }

  /**
   * Creates a quaternion from an axis and angle (in radians).
   * @param axis The axis of rotation.
   * @param angle The angle in radians.
   */
  public static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    const halfAngle = angle * 0.5;
    const s = Math.sin(halfAngle);
    axis = axis.normalize();
    return new Quaternion(
      axis.x * s,
      axis.y * s,
      axis.z * s,
      Math.cos(halfAngle),
    );
  }

  /**
   * Creates a quaternion from Euler angles (in radians).
   * @param x Rotation around X axis in radians.
   * @param y Rotation around Y axis in radians.
   * @param z Rotation around Z axis in radians.
   */
  public static fromEuler(vector: Vector3): Quaternion;
  public static fromEuler(x: number, y: number, z: number): Quaternion;
  public static fromEuler(xOrVector: number | Vector3, y?: number, z?: number): Quaternion {
    // From: https://github.com/BabylonJS/Babylon.js/blob/86bda66b6f61e482374c1a0597f1f504cd75837d/packages/dev/core/src/Maths/math.vector.ts#L5650
    let xValue: number;
    let yValue: number;
    let zValue: number;
    if (xOrVector instanceof Vector3) {
      xValue = xOrVector.x;
      yValue = xOrVector.y;
      zValue = xOrVector.z;
    } else {
      xValue = xOrVector;
      yValue = y!;
      zValue = z!;
    }

    const halfRoll = zValue * 0.5;
    const halfPitch = xValue * 0.5;
    const halfYaw = yValue * 0.5;
    const sinRoll = Math.sin(halfRoll);
    const cosRoll = Math.cos(halfRoll);
    const sinPitch = Math.sin(halfPitch);
    const cosPitch = Math.cos(halfPitch);
    const sinYaw = Math.sin(halfYaw);
    const cosYaw = Math.cos(halfYaw);

    return new Quaternion(
      cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll,
      sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll,
      cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll,
      cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll,
    );
  }

  public static fromLookDirection(forward: Vector3, up: Vector3): Quaternion {
    // Validate
    if (Math.abs(forward.dot(up)) > 1e-8) {
      throw new Error(`Cannot create Quaternion from look direction - 'forward' and 'up' vectors must be orthogonal. (DEBUG: (dot='${forward.dot(up)}')) Provided: (forward='${forward}') (up='${up}')`);
    }
    // Sanitise
    if (!forward.isNormalized()) {
      forward = forward.normalize();
    }
    if (!up.isNormalized()) {
      up = up.normalize();
    }

    const right = up.cross(forward);

    // Mostly from: https://github.com/BabylonJS/Babylon.js/blob/86bda66b6f61e482374c1a0597f1f504cd75837d/packages/dev/core/src/Maths/math.vector.ts#L5335
    const trace = right.x + up.y + forward.z;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      return new Quaternion(
        (up.z - forward.y) * s,
        (forward.x - right.z) * s,
        (right.y - up.x) * s,
        0.25 / s,
      );
    } else if (right.x > up.y && right.x > forward.z) {
      const s = 2.0 * Math.sqrt(1.0 + right.x - up.y - forward.z);
      return new Quaternion(
        0.25 * s,
        (up.x + right.y) / s,
        (forward.x + right.z) / s,
        (up.z - forward.y) / s,
      );
    } else if (up.y > forward.z) {
      const s = 2.0 * Math.sqrt(1.0 + up.y - right.x - forward.z);
      return new Quaternion(
        (up.x + right.y) / s,
        0.25 * s,
        (forward.y + up.z) / s,
        (forward.x - right.z) / s,
      );
    } else {
      const s = 2.0 * Math.sqrt(1.0 + forward.z - right.x - up.y);
      return new Quaternion(
        (forward.x + right.z) / s,
        (forward.y + up.z) / s,
        0.25 * s,
        (right.y - up.x) / s,
      );
    }
  }

  /**
   * Convert the quaternion to Euler angles (in radians).
   */
  public toEuler(): Vector3 {
    // From: https://github.com/BabylonJS/Babylon.js/blob/86bda66b6f61e482374c1a0597f1f504cd75837d/packages/dev/core/src/Maths/math.vector.ts#L5217
    const result = new Vector3(0, 0, 0);

    const qz = this.z;
    const qx = this.x;
    const qy = this.y;
    const qw = this.w;

    const zAxisY = qy * qz - qx * qw;
    const limit = 0.4999999;

    if (zAxisY < -limit) {
      result.y = 2 * Math.atan2(qy, qw);
      result.x = Math.PI / 2;
      result.z = 0;
    } else if (zAxisY > limit) {
      result.y = 2 * Math.atan2(qy, qw);
      result.x = -Math.PI / 2;
      result.z = 0;
    } else {
      const sqw = qw * qw;
      const sqz = qz * qz;
      const sqx = qx * qx;
      const sqy = qy * qy;
      result.z = Math.atan2(2.0 * (qx * qy + qz * qw), -sqz - sqx + sqy + sqw);
      result.x = Math.asin(-2.0 * zAxisY);
      result.y = Math.atan2(2.0 * (qz * qx + qy * qw), sqz - sqx - sqy + sqw);
    }

    return result;
  }

  /**
   * Create a quaternion that represents no rotation.
   */
  public static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  public clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  public multiply(q: Quaternion): Quaternion {
    const { x, y, z, w } = this;
    return new Quaternion(
      w * q.x + x * q.w + y * q.z - z * q.y,
      w * q.y - x * q.z + y * q.w + z * q.x,
      w * q.z + x * q.y - y * q.x + z * q.w,
      w * q.w - x * q.x - y * q.y - z * q.z,
    );
  }

  public multiplySelf(q: Quaternion): Quaternion {
    const { x, y, z, w } = this;
    this.x = w * q.x + x * q.w + y * q.z - z * q.y;
    this.y = w * q.y - x * q.z + y * q.w + z * q.x;
    this.z = w * q.z + x * q.y - y * q.x + z * q.w;
    this.w = w * q.w - x * q.x - y * q.y - z * q.z;
    return this;
  }

  public static slerp(left: Quaternion, right: Quaternion, t: number): Quaternion {
    // Sanitise
    t = Math.min(1, Math.max(t, 0));

    // From: https://github.com/BabylonJS/Babylon.js/blob/86bda66b6f61e482374c1a0597f1f504cd75837d/packages/dev/core/src/Maths/math.vector.ts#L5826
    let num2;
    let num3;
    let num4 = left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
    let flag = false;

    if (num4 < 0) {
      flag = true;
      num4 = -num4;
    }

    if (num4 > 0.999999) {
      num3 = 1 - t;
      num2 = flag ? -t : t;
    } else {
      const num5 = Math.acos(num4);
      const num6 = 1.0 / Math.sin(num5);
      num3 = Math.sin((1.0 - t) * num5) * num6;
      num2 = flag ? -Math.sin(t * num5) * num6 : Math.sin(t * num5) * num6;
    }

    return new Quaternion(
      num3 * left.x + num2 * right.x,
      num3 * left.y + num2 * right.y,
      num3 * left.z + num2 * right.z,
      num3 * left.w + num2 * right.w,
    );
  }

  public conjugate(): Quaternion {
    return new Quaternion(-this.x, -this.y, -this.z, this.w);
  }

  public normalize(): Quaternion {
    const n = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    if (n === 0) return new Quaternion(0, 0, 0, 1);
    return new Quaternion(this.x / n, this.y / n, this.z / n, this.w / n);
  }

  public invert(): Quaternion {
    const n2 = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    if (n2 === 0) return new Quaternion(0, 0, 0, 1);
    const conj = this.conjugate();
    return new Quaternion(conj.x / n2, conj.y / n2, conj.z / n2, conj.w / n2);
  }

  public setValue(value: Quaternion): void {
    this.x = value.x;
    this.y = value.y;
    this.z = value.z;
    this.w = value.w;
  }

  public toString(): string {
    return `Quaternion(x=${this.x}, y=${this.y}, z=${this.z}, w=${this.w})`;
  }
}
