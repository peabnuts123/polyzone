import type { Vector3 } from '@polyzone/core/src/util';

export interface ITransformData {
  get position(): Vector3;
  get rotation(): Vector3;
  get scale(): Vector3;
}

export class TransformData implements ITransformData {
  public position: Vector3;
  public rotation: Vector3;
  public scale: Vector3;

  public constructor(position: Vector3, rotation: Vector3, scale: Vector3) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }
}
