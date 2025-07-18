import { Quaternion } from "../util/Quaternion";
import type { Vector3 } from "../util/Vector3";
import type { GameObject } from "./GameObject";

// @TODO just lift it straight up into GameObject maybe
export abstract class Transform {
  /* Position */
  // @TODO Rename local stuff to `position` etc
  // @TODO or the absolute ones?
  public abstract get localPosition(): Vector3;
  public abstract set localPosition(value: Vector3);
  public abstract get absolutePosition(): Vector3;
  public abstract set absolutePosition(value: Vector3);

  /* Rotation */
  public abstract get absoluteRotation(): Quaternion;
  public abstract set absoluteRotation(value: Quaternion);
  public abstract get localRotation(): Quaternion;
  public abstract set localRotation(value: Quaternion);
  public abstract rotate(value: Vector3): void;

  /* Scale */
  public abstract get absoluteScale(): Vector3;
  public abstract set absoluteScale(value: Vector3);
  public abstract get localScale(): Vector3;
  public abstract set localScale(value: Vector3);

  /* Parent */
  public abstract get parent(): Transform | undefined;
  public abstract set parent(value: Transform | undefined);

  public abstract get gameObject(): GameObject;

  public abstract get children(): Transform[];
}
