import { Enum } from "../util/types";
import { Vector2 } from '../math';

/**
 * A player index. Player 1 is `0`.
 */
export type PlayerNumber = number;
/**
 * A number that is intended to be between values 0 and 1 (inclusive).
 */
export type NumberZeroToOne = number;
/**
 * A {@link Vector2} where the value of each axis is intended to be between -1 and 1 (inclusive).
 */
export type AxisValue = Vector2;

export const InputButton = {
  L1: 'L1',
  L2: 'L2',
  L3: 'L3',
  R1: 'R1',
  R2: 'R2',
  R3: 'R3',
  Up: 'Up',
  Down: 'Down',
  Left: 'Left',
  Right: 'Right',
  A: 'A',
  B: 'B',
  X: 'X',
  Y: 'Y',
  Start: 'Start',
  Select: 'Select',
} as const;
export type InputButton = Enum<typeof InputButton>;

export const InputAxis = {
  Left: 'Left',
  Right: 'Right',
} as const;
export type InputAxis = Enum<typeof InputAxis>;


export abstract class Input {
  public abstract wasButtonPressed(button: InputButton, playerNumber?: PlayerNumber): boolean;
  public abstract wasButtonReleased(button: InputButton, playerNumber?: PlayerNumber): boolean;
  public abstract isButtonDown(button: InputButton, playerNumber?: PlayerNumber): boolean;
  public abstract getButtonValue(button: InputButton, playerNumber?: PlayerNumber): NumberZeroToOne;
  public abstract getAxisValue(axis: InputAxis, playerNumber?: PlayerNumber): Vector2;
}
