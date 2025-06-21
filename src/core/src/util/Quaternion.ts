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

  /**
   * Convert the quaternion to Euler angles (in radians).
   */
  public toEuler(): Vector3 {
    // From: https://github.com/BabylonJS/Babylon.js/blob/86bda66b6f61e482374c1a0597f1f504cd75837d/packages/dev/core/src/Maths/math.vector.ts#L5217
    const result = new Vector3(0, 0, 0);

    const qz = this._z;
    const qx = this._x;
    const qy = this._y;
    const qw = this._w;

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
}
