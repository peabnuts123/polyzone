import { makeObservable } from "mobx";
import { AnyVector, Vector3 } from "@polyzone/core/src/util";

/**
 * Thin wrapper for Vector3 that marks its properties as observable properties for mobx
 */
export class ObservableVector3 extends Vector3 {
  constructor(x: number, y: number, z: number);
  constructor(source: Vector3);
  constructor(sourceOrX: Vector3 | number, y?: number, z?: number) {
    if (sourceOrX instanceof Vector3) {
      super(sourceOrX.x, sourceOrX.y, sourceOrX.z);
    } else {
      super(sourceOrX, y!, z!);
    }

    // @NOTE List of private property names, so that MobX can reference them
    type PrivateProperties = '_x' | '_y' | '_z'; // @TODO Do I need to annotate all the functions? `override` or something?
    makeObservable<ObservableVector3, PrivateProperties>(this, {
      _x: true,
      _y: true,
      _z: true,
    });
  }

  public override add(value: AnyVector): ObservableVector3 {
    return new ObservableVector3(super.add(value));
  }

  public override subtract(value: AnyVector): ObservableVector3 {
    return new ObservableVector3(super.subtract(value));
  }

  public multiply(factor: number): ObservableVector3;
  public multiply(other: Vector3): ObservableVector3;
  public override multiply(operand: number | Vector3): ObservableVector3 {
    if (operand instanceof Vector3) {
      return new ObservableVector3(super.multiply(operand));
    } else {
      return new ObservableVector3(super.multiply(operand));
    }
  }

  public divide(factor: number): ObservableVector3;
  public divide(other: Vector3): ObservableVector3;
  public divide(operand: number | Vector3): ObservableVector3 {
    if (operand instanceof Vector3) {
      return new ObservableVector3(super.divide(operand));
    } else {
      return new ObservableVector3(super.divide(operand));
    }
  }

  public normalize(): ObservableVector3 {
    return new ObservableVector3(super.normalize());
  }

  public clone(): ObservableVector3 {
    return new ObservableVector3(super.clone());
  }

  public withX(x: number): ObservableVector3 {
    return new ObservableVector3(super.withX(x));
  }

  public withY(y: number): ObservableVector3 {
    return new ObservableVector3(super.withY(y));
  }

  public withZ(z: number): ObservableVector3 {
    return new ObservableVector3(super.withZ(z));
  }

  public static zero(): ObservableVector3 {
    return new ObservableVector3(Vector3.zero());
  }
  public static one(): ObservableVector3 {
    return new ObservableVector3(Vector3.one());
  }
}
