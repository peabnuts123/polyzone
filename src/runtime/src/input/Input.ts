import { GamepadAxis, GamepadButton, IInputSystem, KeyCode } from '@lopoly/engine/input';
import { InputAxis, InputButton, Input as InputCore, NumberZeroToOne, PlayerNumber } from '@polyzone/core/input';
import { Vector2 } from '@polyzone/core/math';

export class Input extends InputCore {
  private readonly input: IInputSystem;

  public constructor(lopolyInput: IInputSystem) {
    super();
    this.input = lopolyInput;
  }

  public wasButtonPressed(button: InputButton, playerNumber?: PlayerNumber): boolean {
    return this.input.wasButtonPressed(button, playerNumber);
  }
  public wasButtonReleased(button: InputButton, playerNumber?: PlayerNumber): boolean {
    return this.input.wasButtonReleased(button, playerNumber);
  }
  public isButtonDown(button: InputButton, playerNumber?: PlayerNumber): boolean {
    return this.input.isButtonDown(button, playerNumber);
  }
  public getButtonValue(button: InputButton, playerNumber?: PlayerNumber): NumberZeroToOne {
    return this.input.getButtonValue(button, playerNumber);
  }
  public getAxisValue(axis: InputAxis, playerNumber?: PlayerNumber): Vector2 {
    return new Vector2(
      this.input.getAxisValue(`${axis}:x`, playerNumber),
      this.input.getAxisValue(`${axis}:y`, playerNumber),
    );
  }

  public static configureDefaultBindings(lopolyInput: IInputSystem): void {
    lopolyInput.configure({
      buttons: [
        {
          name: InputButton.L1, bindings: [
            GamepadButton.L1,
          ],
        },
        {
          name: InputButton.L2, bindings: [
            GamepadButton.L2,
          ],
        },
        {
          name: InputButton.L3, bindings: [
            GamepadButton.L3,
          ],
        },
        {
          name: InputButton.R1, bindings: [
            GamepadButton.R1,
          ],
        },
        {
          name: InputButton.R2, bindings: [
            GamepadButton.R2,
          ],
        },
        {
          name: InputButton.R3, bindings: [
            GamepadButton.R3,
          ],
        },
        {
          name: InputButton.Up, bindings: [
            GamepadButton.DpadUp,
            KeyCode.KeyW,
            KeyCode.ArrowUp,
          ],
        },
        {
          name: InputButton.Down, bindings: [
            GamepadButton.DpadDown,
            KeyCode.KeyS,
            KeyCode.ArrowDown,
          ],
        },
        {
          name: InputButton.Left, bindings: [
            GamepadButton.DpadLeft,
            KeyCode.KeyA,
            KeyCode.ArrowLeft,
          ],
        },
        {
          name: InputButton.Right, bindings: [
            GamepadButton.DpadRight,
            KeyCode.KeyD,
            KeyCode.ArrowRight,
          ],
        },
        {
          name: InputButton.A, bindings: [
            GamepadButton.South,
            KeyCode.Space,
          ],
        },
        {
          name: InputButton.B, bindings: [
            GamepadButton.East,
          ],
        },
        {
          name: InputButton.X, bindings: [
            GamepadButton.West,
          ],
        },
        {
          name: InputButton.Y, bindings: [
            GamepadButton.North,
          ],
        },
        {
          name: InputButton.Start, bindings: [
            GamepadButton.Start,
            KeyCode.Escape,
          ],
        },
        {
          name: InputButton.Select, bindings: [
            GamepadButton.Select,
          ],
        },
      ],
      axes: [
        {
          name: `${InputAxis.Left}:x`, bindings: [
            GamepadAxis.JoyLeftX,
          ],
        },
        {
          name: `${InputAxis.Left}:y`, bindings: [
            GamepadAxis.JoyLeftY,
          ],
        },
        {
          name: `${InputAxis.Right}:x`, bindings: [
            GamepadAxis.JoyRightX,
          ],
        },
        {
          name: `${InputAxis.Right}:y`, bindings: [
            GamepadAxis.JoyRightY,
          ],
        },
      ],
    });
  }
}
