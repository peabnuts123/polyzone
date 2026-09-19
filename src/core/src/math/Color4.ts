import { Color4 as LoPolyColor4, Color4Like } from '@lopoly/engine/math/Color4';
import { Color3Like } from '@lopoly/engine/math/Color3';

export type { Color4Like } from '@lopoly/engine/math/Color4';

export class Color4 extends LoPolyColor4 {
  public constructor(color: Color4);
  public constructor(color: Color3Like, a?: number);
  public constructor(r: number, g: number, b: number, a?: number);
  public constructor(redOrColor: number | Color3Like | Color4Like, greenOrAlpha?: number, maybeBlue?: number, maybeAlpha?: number) {
    if (typeof redOrColor === 'number') {
      if (typeof greenOrAlpha === 'number' && typeof maybeBlue === 'number') {
        // RGB(A)
        super(
          redOrColor,
          greenOrAlpha,
          maybeBlue,
          maybeAlpha ?? 0xFF,
        );
      } else throw new Error(`Unrecognised parameters to ${Color4.name}`);
    } else {
      const color = redOrColor;
      if ('a' in color) {
        // Color4
        super(
          color.r,
          color.g,
          color.b,
          color.a,
        );
      } else {
        // Color3 + (Alpha)
        super(
          color.r,
          color.g,
          color.b,
          greenOrAlpha ?? 0xFF,
        );
      }
    }
  }

  public override clone(): Color4 {
    return new Color4(this.r, this.g, this.b, this.a);
  }

  public override withR(value: number): Color4 {
    return new Color4(value, this.g, this.b, this.a);
  }

  public override withG(value: number): Color4 {
    return new Color4(this.r, value, this.b, this.a);
  }

  public override withB(value: number): Color4 {
    return new Color4(this.r, this.g, value, this.a);
  }

  public override withA(value: number): Color4 {
    return new Color4(this.r, this.g, this.b, value);
  }

  public static white(): Color4 { return new Color4(0xFF, 0xFF, 0xFF); }
  public static black(): Color4 { return new Color4(0, 0, 0); }
  public static red(): Color4 { return new Color4(0xFF, 0, 0); }
  public static green(): Color4 { return new Color4(0, 0xFF, 0); }
  public static blue(): Color4 { return new Color4(0, 0, 0xFF); }
  public static yellow(): Color4 { return new Color4(0xFF, 0xFF, 0); }
  public static fuchsia(): Color4 { return new Color4(0xFF, 0, 0xFF); }
  public static cyan(): Color4 { return new Color4(0, 0xFF, 0xFF); }
}
