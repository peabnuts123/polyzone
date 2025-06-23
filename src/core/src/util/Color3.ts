import { Color4 } from "./Color4";

export class Color3 {
  private _r: number;
  private _g: number;
  private _b: number;

  public constructor(r: number, g: number, b: number) {
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

    this._r = r;
    this._g = g;
    this._b = b;
  }

  public withR(value: number): Color3 {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    return new Color3(value, this.g, this.b);
  }

  public withG(value: number): Color3 {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    return new Color3(this.r, value, this.b);
  }

  public withB(value: number): Color3 {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    return new Color3(this.r, this.g, value);
  }

  public toColor4(alpha: number = 0xFF): Color4 {
    return new Color4(this, alpha);
  }

  public toString(): string {
    return `Color3(${this.r}, ${this.g}, ${this.b})`;
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

  public static white(): Color3 { return new Color3(0xFF, 0xFF, 0xFF); }
  public static black(): Color3 { return new Color3(0, 0, 0); }
  public static red(): Color3 { return new Color3(0xFF, 0, 0); }
  public static green(): Color3 { return new Color3(0, 0xFF, 0); }
  public static blue(): Color3 { return new Color3(0, 0, 0xFF); }
  public static yellow(): Color3 { return new Color3(0xFF, 0xFF, 0); }
  public static fuchsia(): Color3 { return new Color3(0xFF, 0, 0xFF); }
  public static cyan(): Color3 { return new Color3(0, 0xFF, 0xFF); }
}
