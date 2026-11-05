import { createAtom } from "mobx";
import { AnyVector } from "@lopoly/engine/math";
import { Vector3 } from "@polyzone/core/math";

/**
 * Bridges LoPoly vector notifications into MobX dependency tracking.
 */
export class ObservableVector3 extends Vector3 {
  private readonly mobxAtom = createAtom("ObservableVector3");

  constructor(x: number, y: number, z: number);
  constructor(source: Vector3);
  constructor(sourceOrX: Vector3 | number, y?: number, z?: number) {
    if (sourceOrX instanceof Vector3) {
      super(sourceOrX.x, sourceOrX.y, sourceOrX.z);
    } else {
      super(sourceOrX, y!, z!);
    }
  }

  protected override notifyOnChange(): void {
    super.notifyOnChange();
    this.mobxAtom.reportChanged();
  }

  public override get x(): number {
    this.mobxAtom.reportObserved();
    return super.x;
  }

  public override set x(value: number) {
    super.x = value;
  }

  public override get y(): number {
    this.mobxAtom.reportObserved();
    return super.y;
  }

  public override set y(value: number) {
    super.y = value;
  }

  public override get z(): number {
    this.mobxAtom.reportObserved();
    return super.z;
  }

  public override set z(value: number) {
    super.z = value;
  }

  public override add(value: AnyVector): ObservableVector3 {
    return new ObservableVector3(super.add(value));
  }

  public override subtract(value: AnyVector): ObservableVector3 {
    return new ObservableVector3(super.subtract(value));
  }

  public override scale(factor: number): ObservableVector3;
  public override scale(other: Vector3): ObservableVector3;
  public override scale(operand: number | Vector3): ObservableVector3 {
    if (operand instanceof Vector3) {
      return new ObservableVector3(super.scale(operand));
    } else {
      return new ObservableVector3(super.scale(operand));
    }
  }

  public override normalize(): ObservableVector3 {
    return new ObservableVector3(super.normalize());
  }

  public override clone(): ObservableVector3 {
    return new ObservableVector3(super.clone());
  }

  public override withX(x: number): ObservableVector3 {
    return new ObservableVector3(super.withX(x));
  }

  public override withY(y: number): ObservableVector3 {
    return new ObservableVector3(super.withY(y));
  }

  public override withZ(z: number): ObservableVector3 {
    return new ObservableVector3(super.withZ(z));
  }

  public static override zero(): ObservableVector3 {
    return new ObservableVector3(Vector3.zero());
  }
  public static override one(): ObservableVector3 {
    return new ObservableVector3(Vector3.one());
  }
}
