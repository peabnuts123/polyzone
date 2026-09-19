import { type Vector2Like, Vector2 as LoPolyVector2 } from '@lopoly/engine/math/Vector2';

import { Context } from "@polyzone/core/Context";
export { type Vector2Like } from '@lopoly/engine/math/Vector2';

// @TODO override anything that returns Vector2
// @TODO expend budget
export class Vector2 extends LoPolyVector2 {
  public constructor(color: Vector2Like);
  public constructor(x: number, y: number);
  public constructor(xOrVector: number | Vector2Like, maybeY?: number) {
    if (typeof xOrVector === 'number') {
      if (typeof maybeY === 'number') {
        super(
          xOrVector,
          maybeY,
        );
      } else throw new Error(`Unrecognised parameters to ${Vector2.name}`);
    } else {
      const vector = xOrVector;
      super(
        vector.x,
        vector.y,
      );
    }
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

  public static zero(): Vector2 { return new Vector2(0, 0); }
  public static one(): Vector2 { return new Vector2(1, 1); }
}
