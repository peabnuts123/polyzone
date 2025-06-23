import { Color3 } from "./Color3";

export class Color4 {
  public _r: number;
  public _g: number;
  public _b: number;
  public _a: number;

  public constructor(color: Color3, a?: number);
  public constructor(r: number, g: number, b: number, a?: number);
  public constructor(redOrColor: number | Color3, greenOrAlpha?: number, blue?: number, alpha?: number) {
    let r: number, g: number, b: number, a: number;
    if (redOrColor instanceof Color3) {
      r = redOrColor.r;
      g = redOrColor.g;
      b = redOrColor.b;
      a = greenOrAlpha ?? 0xFF;
    } else {
      r = redOrColor;
      g = greenOrAlpha!;
      b = blue!;
      a = alpha ?? 0xFF;
    }

    // Validate
    /* Red */
    if (r < 0) r = 0;
    else if (r > 0xFF) r = 0xFF;
    /* Green */
    if (g < 0) g = 0;
    else if (g > 0xFF) g = 0xFF;
    /* Blue */
    if (b < 0) b = 0;
    else if (b > 0xFF) b = 0xFF;
    /* Alpha */
    if (a < 0) a = 0;
    else if (a > 0xFF) a = 0xFF;

    this._r = r;
    this._g = g;
    this._b = b;
    this._a = a;
  }


  public withR(value: number): Color4 {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    return new Color4(value, this.g, this.b, this.a);
  }

  public withG(value: number): Color4 {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    return new Color4(this.r, value, this.b, this.a);
  }

  public withB(value: number): Color4 {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    return new Color4(this.r, this.g, value, this.a);
  }

  public withA(value: number): Color4 {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    return new Color4(this.r, this.g, this.b, value);
  }

  public get r(): number { return this._r; }
  public set r(value: number) {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    this._r = value;
  }
  public get g(): number { return this._g; }
  public set g(value: number) {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    this._g = value;
  }
  public get b(): number { return this._b; }
  public set b(value: number) {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    this._b = value;
  }
  public get a(): number { return this._a; }
  public set a(value: number) {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    this._a = value;
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
