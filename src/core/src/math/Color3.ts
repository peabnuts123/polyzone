import { Color3 as LoPolyColor3, Color3Like } from '@lopoly/engine/math/Color3';
import { Color4 } from "./Color4";

export type { Color3Like } from '@lopoly/engine/math/Color3';

export class Color3 extends LoPolyColor3 {
  public constructor(color: Color3Like);
  public constructor(r: number, g: number, b: number);
  public constructor(rOrColor: number | Color3Like, maybeG?: number, maybeB?: number) {
    if (typeof rOrColor === 'number') {
      if (typeof maybeG === 'number' && typeof maybeB === 'number') {
        super(
          rOrColor,
          maybeG,
          maybeB,
        );
      } else throw new Error(`Unrecognised parameters to ${Color3.name}`);
    } else {
      const color = rOrColor;
      super(
        color.r,
        color.g,
        color.b,
      );
    }
  }

  public override clone(): Color3 {
    return new Color3(this);
  }

  public override withR(value: number): Color3 {
    return new Color3(value, this.g, this.b);
  }

  public override withG(value: number): Color3 {
    return new Color3(this.r, value, this.b);
  }

  public override withB(value: number): Color3 {
    return new Color3(this.r, this.g, value);
  }

  public override toColor4(alpha: number = 0xFF): Color4 {
    return new Color4(this, alpha);
  }

  public static white(): Color3 { return new Color3(0xFF, 0xFF, 0xFF); }
  public static black(): Color3 { return new Color3(0, 0, 0); }
  public static red(): Color3 { return new Color3(0xFF, 0, 0); }
  public static green(): Color3 { return new Color3(0, 0xFF, 0); }
  public static blue(): Color3 { return new Color3(0, 0, 0xFF); }
  public static yellow(): Color3 { return new Color3(0xFF, 0xFF, 0); }
  public static fuchsia(): Color3 { return new Color3(0xFF, 0, 0xFF); }
  public static cyan(): Color3 { return new Color3(0, 0xFF, 0xFF); }
}
