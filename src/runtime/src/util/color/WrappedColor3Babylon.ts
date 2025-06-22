import { Color3 as Color3Babylon } from "@babylonjs/core/Maths/math.color";
import { Color3 as Color3Core, Color4 } from "@polyzone/core/src/util";
import { toColor3Babylon, babylonColorValueToCore, coreColorValueToBabylon } from '@polyzone/runtime/src/util/color';

/**
* A Color3 that is implemented around wrapping a Babylon Color3 internally.
*/
export class WrappedColor3Babylon extends Color3Core {
  /**
   * A function that can access the color that is being wrapped.
   */
  private readonly getValue: () => Color3Babylon;
  /**
   * A function that can set the value of the color being wrapped.
   */
  private readonly _setValue: (value: Color3Babylon) => void;

  public constructor(getValue: () => Color3Babylon, setValue: (value: Color3Babylon) => void) {
    super(0, 0, 0); // @NOTE Super values NOT used
    this.getValue = getValue;
    this._setValue = setValue;
  }

  public override get r(): number { return babylonColorValueToCore(this.getValue().r); }
  public override set r(value: number) {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    // Update
    const color = this.getValue();
    this._setValue(new Color3Babylon(
      coreColorValueToBabylon(value),
      color.g,
      color.b,
    ));
  }

  public override get g(): number { return babylonColorValueToCore(this.getValue().g); }
  public override set g(value: number) {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    // Update
    const color = this.getValue();
    this._setValue(new Color3Babylon(
      color.r,
      coreColorValueToBabylon(value),
      color.b,
    ));
  }

  public override get b(): number { return babylonColorValueToCore(this.getValue().b); }
  public override set b(value: number) {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    // Update
    const color = this.getValue();
    this._setValue(new Color3Babylon(
      color.r,
      color.g,
      coreColorValueToBabylon(value),
    ));
  }

  public setValue(value: Color3Core): void {
    // Validate
    /* Red */
    if (value.r < 0) value.r = 0;
    else if (value.r > 0xFF) value.r = 0xFF;
    /* Green */
    if (value.g < 0) value.g = 0;
    else if (value.g > 0xFF) value.g = 0xFF;
    /* Blue */
    if (value.b < 0) value.b = 0;
    else if (value.b > 0xFF) value.b = 0xFF;

    this._setValue(toColor3Babylon(value));
  }

  /*
   * =====================================================
   * Optimised versions of Color3 functions to perform
   * operations efficiently without thrashing get/setValue
   * =====================================================
   */

  public override toColor4(alpha: number = 0xFF): Color4 {
    // Validate
    if (alpha < 0) alpha = 0;
    else if (alpha > 0xFF) alpha = 0xFF;

    const currentValue = this.getValue();
    return new Color4(
      babylonColorValueToCore(currentValue.r),
      babylonColorValueToCore(currentValue.g),
      babylonColorValueToCore(currentValue.b),
      alpha,
    );
  }

  public override withR(value: number): Color3Core {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    const currentValue = this.getValue();
    return new Color3Core(
      value,
      babylonColorValueToCore(currentValue.g),
      babylonColorValueToCore(currentValue.b),
    );
  }
  public override withG(value: number): Color3Core {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    const currentValue = this.getValue();
    return new Color3Core(
      babylonColorValueToCore(currentValue.r),
      value,
      babylonColorValueToCore(currentValue.b),
    );
  }
  public override withB(value: number): Color3Core {
    // Validate
    if (value < 0) value = 0;
    else if (value > 0xFF) value = 0xFF;

    const currentValue = this.getValue();
    return new Color3Core(
      babylonColorValueToCore(currentValue.r),
      babylonColorValueToCore(currentValue.g),
      value,
    );
  }

  public override toString(): string {
    const currentValue = this.getValue();
    return `Color3(${currentValue.r}, ${currentValue.g}, ${currentValue.b})`;
  }
}
