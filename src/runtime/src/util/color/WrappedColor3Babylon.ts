import { Color3 as Color3Babylon } from "@babylonjs/core/Maths/math.color";
import { Color3 as Color3Core } from "@polyzone/core/src/util";
import { toColor3Babylon } from '@polyzone/runtime/src/util/color';

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
    const color = getValue();
    super(color.r, color.g, color.b);
    this.getValue = getValue;
    this._setValue = setValue;
  }

  public override get r(): number { return this.getValue().r; }
  public override set r(value: number) {
    const color = this.getValue();
    this._setValue(new Color3Babylon(
      value,
      color.g,
      color.b,
    ));
  }

  public override get g(): number { return this.getValue().g; }
  public override set g(value: number) {
    const color = this.getValue();
    this._setValue(new Color3Babylon(
      color.r,
      value,
      color.b,
    ));
  }

  public override get b(): number { return this.getValue().b; }
  public override set b(value: number) {
    const color = this.getValue();
    this._setValue(new Color3Babylon(
      color.r,
      color.g,
      value,
    ));
  }

  public setValue(value: Color3Core): void {
    this._setValue(toColor3Babylon(value));
  }
}
