import { makeAutoObservable, observable } from "mobx";
import { ITransformData } from "@polyzone/runtime/cartridge";
import { Vector3 } from "@polyzone/core/math";
import { ObservableVector3 } from "@lib/util/vector";

export class TransformData implements ITransformData {
  private _position: ObservableVector3;
  private _rotation: ObservableVector3;
  private _scale: ObservableVector3;

  public constructor(position: Vector3, rotation: Vector3, scale: Vector3) {
    this._position = new ObservableVector3(position);
    this._rotation = new ObservableVector3(rotation);
    this._scale = new ObservableVector3(scale);

    makeAutoObservable<TransformData, "_position" | "_rotation" | "_scale">(this, {
      _position: observable.ref,
      _rotation: observable.ref,
      _scale: observable.ref,
    });
  }

  public get position(): Vector3 { return this._position; }
  public set position(value: Vector3) { this._position = new ObservableVector3(value); }

  // @TODO Needs to be EulerVector ... observable ... good luck
  public get rotation(): Vector3 { return this._rotation; }
  public set rotation(value: Vector3) { this._rotation = new ObservableVector3(value); }

  public get scale(): Vector3 { return this._scale; }
  public set scale(value: Vector3) { this._scale = new ObservableVector3(value); }
}
