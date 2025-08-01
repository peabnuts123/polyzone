import { Quaternion as QuaternionBabylon } from '@babylonjs/core/Maths/math.vector';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';

import { Vector3 } from '@polyzone/core/src/util/Vector3';
import { Transform as TransformCore } from '@polyzone/core/src/world';
import { Quaternion } from '@polyzone/core/src/util/Quaternion';

import type { ITransformData } from '../cartridge';
import { WrappedVector3Babylon } from '../util';
import { WrappedQuaternionBabylon } from '../util/quaternion';
import type { GameObject } from './GameObject';
import { BetterTransformNode } from './BetterTransformNode';

const debugLog = (_: string): void => { };
// const debugLog = console.log;
// const debugLog = console.trace;

/**
 * Implementation of the `ITransform` interface wrapped around
 * a Babylon `BetterTransformNode`.
 */
export class Transform extends TransformCore {
  public readonly node: BetterTransformNode;
  private _parent: Transform | undefined;
  private _gameObject!: GameObject;
  private _children: Transform[];
  private readonly _absolutePosition: WrappedVector3Babylon;
  private readonly _localPosition: WrappedVector3Babylon;
  private readonly _absoluteRotation: WrappedQuaternionBabylon;
  private readonly _localRotation: WrappedQuaternionBabylon;
  private readonly _absoluteScale: WrappedVector3Babylon;
  private readonly _localScale: WrappedVector3Babylon;

  public constructor(name: string, scene: BabylonScene, parent: Transform | undefined, transform: ITransformData) {
    super();
    /* Construct new babylon transform (which this type wraps) */
    this.node = new BetterTransformNode(name, scene);
    this.node.rotationQuaternion = QuaternionBabylon.Identity();
    this.parent = parent;
    this._children = [];

    /*
      @NOTE Wrap babylon types in a wrapper.
      The wrapper does not internalise the underlying value, it operates on it by reference,
      using the getter / setter lambdas provided.
    */
    /* Position */
    this._absolutePosition = new WrappedVector3Babylon(
      () => this.node.getAbsolutePosition(),
      (value) => {
        debugLog(`[Transform] (absolutePosition.set) (${name}): ${value}`);
        this.node.setAbsolutePosition(value);
      },
    );
    this._localPosition = new WrappedVector3Babylon(
      () => this.node.position,
      (value) => {
        debugLog(`[Transform] (localPosition.set) (${name}): ${value}`);
        this.node.position = value;
      },
    );
    /* Rotation */
    this._absoluteRotation = new WrappedQuaternionBabylon(
      () => this.node.absoluteRotationQuaternion,
      (value) => {
        debugLog(`[Transform] (absoluteRotation.set) (${name}): ${value}`);
        this.node.absoluteRotationQuaternion = value;
      },
    );
    this._localRotation = new WrappedQuaternionBabylon(
      () => this.node.rotationQuaternion,
      (value) => {
        debugLog(`[Transform] (localRotation.set) (${name}): ${value}`);
        this.node.rotationQuaternion = value;
      },
    );
    /* Scale */
    this._absoluteScale = new WrappedVector3Babylon(
      () => this.node.absoluteScaling,
      (value) => {
        debugLog(`[Transform] (absoluteScale.set) (${name}): ${value}`);
        this.node.absoluteScaling = value;
      },
    );
    this._localScale = new WrappedVector3Babylon(
      () => this.node.scaling,
      (value) => {
        debugLog(`[Transform] (localScale.set) (${name}): ${value}`);
        this.node.scaling = value;
      },
    );

    // Initialise wrapped vectors
    this._localPosition.setValue(transform.position);
    this._localRotation.setValue(Quaternion.fromEuler(transform.rotation));
    this._localScale.setValue(transform.scale);
  }

  /* Position */
  public get absolutePosition(): Vector3 { return this._absolutePosition; }
  public set absolutePosition(value: Vector3) { this._absolutePosition.setValue(value); }
  public get localPosition(): Vector3 { return this._localPosition; }
  public set localPosition(value: Vector3) { this._localPosition.setValue(value); }

  /* Rotation */
  public get absoluteRotation(): Quaternion { return this._absoluteRotation; }
  public set absoluteRotation(value: Quaternion) { this._absoluteRotation.setValue(value); }
  public get localRotation(): Quaternion { return this._localRotation; }
  public set localRotation(value: Quaternion) { this._localRotation.setValue(value); }
  public rotate(value: Vector3): void {
    const rotation = Quaternion.fromEuler(value);
    this._localRotation.setValue(this._localRotation.multiply(rotation));
  }

  /* Scale */
  public get absoluteScale(): Vector3 { return this._absoluteScale; }
  public set absoluteScale(value: Vector3) { this._absoluteScale.setValue(value); }
  public get localScale(): Vector3 { return this._localScale; }
  public set localScale(value: Vector3) { this._localScale.setValue(value); }

  public get parent(): TransformCore | undefined { return this._parent; }
  public set parent(valueCore: TransformCore | undefined) {
    // Update relationships between transforms when `parent` is updated
    const value = valueCore as Transform | undefined;

    // Set the babylon node's parent
    if (value !== undefined) {
      this.node.setParent(value.node);
    } else {
      this.node.setParent(null);
    }

    // Remove this transform from its current parent's children (if applicable)
    if (this._parent !== undefined) {
      this._parent.children.splice(
        this._parent.children.indexOf(this),
        1,
      );
    }

    // Set this transform's parent
    this._parent = value;

    // Add this transform to the new parent's children
    if (value !== undefined) {
      value.children.push(this);
    }
  }

  public get gameObject(): GameObject { return this._gameObject; }
  public set gameObject(value: GameObject) { this._gameObject = value; }

  public get children(): Transform[] { return this._children; }
}
