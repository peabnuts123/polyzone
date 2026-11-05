import { Vector3Like } from '@lopoly/engine/math/Vector3';
import { IReadOnlyQuaternion, Quaternion as LoPolyQuaternion } from '@lopoly/engine/math/Quaternion';

import { Context } from "@polyzone/core/Context";
import { Vector3 } from './Vector3';

// @TODO override anything that returns Vector3
// @TODO expend budget on functions
export class Quaternion extends LoPolyQuaternion {

  // @TODO budget-consuming PolyZone version of EulerVector3
  // public toEuler(): EulerVector3 { }

  public override clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  public override multiply(q: IReadOnlyQuaternion): Quaternion {
    return this.clone().multiplySelf(q);
  }

  public override slerp(right: IReadOnlyQuaternion, t: number): Quaternion {
    return this.clone().slerpSelf(right, t);
  }

  public override invert(): Quaternion {
    return this.clone().invertSelf();
  }

  public override normalize(): Quaternion {
    return this.clone().normalizeSelf();
  }

  public static override identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  public static override fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    return Quaternion.identity().fromAxisAngleSelf(axis, angle);
  }

  public static override fromEuler(x: number, y: number, z: number): Quaternion;
  public static override fromEuler(vector: Vector3Like): Quaternion;
  public static fromEuler(xOrVector: number | Vector3Like, y?: number, z?: number): Quaternion {
    // @NOTE TypeScript is too dumb to figure this one out
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Quaternion.identity().fromEulerSelf(xOrVector as any, y as any, z as any);
  }

  public static override fromLookDirection(forward: Vector3Like, up?: Vector3Like): Quaternion {
    return Quaternion.identity().fromLookDirectionSelf(forward, up);
  }

  public override get x(): number {
    Context.engine?.consumeFrameBudget(10);
    return super.x;
  }
  public override set x(value: number) {
    Context.engine?.consumeFrameBudget(10);
    super.x = value;
  }

  public override get y(): number {
    Context.engine?.consumeFrameBudget(10);
    return super.y;
  }
  public override set y(value: number) {
    Context.engine?.consumeFrameBudget(10);
    super.y = value;
  }

  public override get z(): number {
    Context.engine?.consumeFrameBudget(10);
    return super.z;
  }
  public override set z(value: number) {
    Context.engine?.consumeFrameBudget(10);
    super.z = value;
  }
}
