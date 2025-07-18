import { Quaternion, TmpVectors, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export class BetterTransformNode extends TransformNode {
  public get rotationQuaternion(): Quaternion {
    return super.rotationQuaternion!;
  }

  public set rotationQuaternion(value: Quaternion) {
    super.rotationQuaternion = value;
    this.computeWorldMatrix();
  }

  // @NOTE Seems omitting the getter while defining the setter means the class
  // has an implicit getter that returns `undefined`
  public get absoluteRotationQuaternion(): Quaternion {
    return super.absoluteRotationQuaternion;
  }

  public set absoluteRotationQuaternion(absoluteRotation: Quaternion) {
    if (this.parent) {
      // Get parent's world matrix and decompose
      const parentWorldMatrix = this.parent.getWorldMatrix();
      const parentRotation = TmpVectors.Quaternion[0];
      parentWorldMatrix.decompose(undefined, parentRotation, undefined);
      // Invert parent's rotation
      parentRotation.invertInPlace();
      // Set local rotation so that parent * local = absolute
      if (this.rotationQuaternion !== null) {
        parentRotation.multiplyToRef(absoluteRotation, this.rotationQuaternion);
      } else {
        this.rotationQuaternion = parentRotation.multiply(absoluteRotation);
      }
    } else {
      if (this.rotationQuaternion !== null) {
        this.rotationQuaternion.copyFrom(absoluteRotation);
      } else {
        this.rotationQuaternion = absoluteRotation.clone();
      }
    }

    this.markAsDirty();

    // Update world matrix with new value
    // Will cause cached value to be recomputed next time getter is called
    this.computeWorldMatrix();
  }

  // @NOTE Seems omitting the getter while defining the setter means the class
  // has an implicit getter that returns `undefined`
  public get absoluteScaling(): Vector3 {
    return super.absoluteScaling;
  }

  public set absoluteScaling(absoluteScaling: Vector3) {
    if (this.parent) {
      // Get parent's world matrix and decompose
      const parentScaling = (this.parent as TransformNode).absoluteScaling;

      // Avoid division by zero
      /* X */
      if (parentScaling.x <= Number.EPSILON) {
        console.warn(`Cannot set absolute scaling to '${absoluteScaling}' for node '${this.name}' as its parent(s) scaling.x is currently 0. Its local scaling.x will be set to 1. This will produce unexpected results if this node's parent(s) are scaled back to a non-zero value.`);
        this.scaling.x = 1;
      } else {
        this.scaling.x = absoluteScaling.x / parentScaling.x;
      }
      /* Y */
      if (parentScaling.y <= Number.EPSILON) {
        console.warn(`Cannot set absolute scaling to '${absoluteScaling}' for node '${this.name}' as its parent(s) scaling.y is currently 0. Its local scaling.y will be set to 1. This will produce unexpected results if this node's parent(s) are scaled back to a non-zero value.`);
        this.scaling.y = 1;
      } else {
        this.scaling.y = absoluteScaling.y / parentScaling.y;
      }
      /* Z */
      if (parentScaling.z <= Number.EPSILON) {
        console.warn(`Cannot set absolute scaling to '${absoluteScaling}' for node '${this.name}' as its parent(s) scaling.z is currently 0. Its local scaling.z will be set to 1. This will produce unexpected results if this node's parent(s) are scaled back to a non-zero value.`);
        this.scaling.z = 1;
      } else {
        this.scaling.z = absoluteScaling.z / parentScaling.z;
      }
    } else {
      this.scaling.copyFrom(absoluteScaling);
    }

    this.markAsDirty();

    // Update world matrix with new value
    // Will cause cached value to be recomputed next time getter is called
    this.computeWorldMatrix();
  }
}
