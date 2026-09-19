import { type Vector3Like, AnyVectorLike, Vector3 as LoPolyVector3 } from '@lopoly/engine/math/Vector3';

import { Context } from "@polyzone/core/Context";
export { type Vector3Like, type AnyVectorLike } from '@lopoly/engine/math/Vector3';

// @TODO override anything that returns Vector3
// @TODO expend budget
export class Vector3 extends LoPolyVector3 {
  // public constructor(color: Vector3Like);
  // public constructor(x: number, y: number, z: number);
  // public constructor(xOrVector: number | Vector3Like, maybeY?: number, maybeZ?: number) {
  //   this.internal = new Vector3InternalBuffer();
  //   if (typeof xOrVector === 'number') {
  //     if (typeof maybeY === 'number' && typeof maybeZ === 'number') {
  //       this.internal.x = xOrVector;
  //       this.internal.y = maybeY;
  //       this.internal.z = maybeZ;
  //     } else throw new Error(`Unrecognised parameters to ${Vector3.name}`);
  //   } else {
  //     const vector = xOrVector;
  //     this.internal.x = vector.x;
  //     this.internal.y = vector.y;
  //     this.internal.z = vector.z;
  //   }
  // }
  public constructor(color: Vector3Like);
  public constructor(x: number, y: number, z: number);
  public constructor(xOrVector: number | Vector3Like, maybeY?: number, maybeZ?: number) {
    if (typeof xOrVector === 'number') {
      if (typeof maybeY === 'number' && typeof maybeZ === 'number') {
        super(
          xOrVector,
          maybeY,
          maybeZ,
        );
      } else throw new Error(`Unrecognised parameters to ${Vector3.name}`);
    } else {
      const vector = xOrVector;
      super(
        vector.x,
        vector.y,
        vector.z,
      );
    }
  }

  public override clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  public override add(value: AnyVectorLike): Vector3 {
    return this.clone().addSelf(value);
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

  public static zero(): Vector3 { return new Vector3(0, 0, 0); }
  public static one(): Vector3 { return new Vector3(1, 1, 1); }

  public static up(): Vector3 { return new Vector3(0, 0, 1); }
  public static down(): Vector3 { return new Vector3(0, 0, -1); }
  public static right(): Vector3 { return new Vector3(1, 0, 0); }
  public static left(): Vector3 { return new Vector3(-1, 0, 0); }
  public static forward(): Vector3 { return new Vector3(0, 1, 0); }
  public static back(): Vector3 { return new Vector3(0, -1, 0); }
}
