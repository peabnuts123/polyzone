import { IScene, Scene as LoPolyScene, SceneNode } from '@lopoly/engine/scene';
import { Model } from "@lopoly/engine/models";
import { Quaternion, Vector3 } from "@polyzone/core/math";
import { AxisAlignedBoundingBox } from "@lopoly/engine/collision";
import { PointerState } from "@lopoly/engine/input";
import { RadiansToDegrees } from '@lopoly/engine';

import { SetGameObjectRotationMutation } from "@lib/mutation/SceneView/mutations";

import type { ISceneViewController } from "../SceneViewController";
import { GizmoPlane, GizmoPlaneNormal } from './GizmoPlane';
import { GizmoData, GizmoNodeBase, GizmoResources, IGizmoActiveState } from './GizmoBase';


/**
 * Valid properties for data associated with a {@link RotateGizmoNode}.
 */
export type RotateGizmoHandleType =
  'x' |
  'y' |
  'z';

/**
 * Object containing data related to a {@link RotateGizmoNode}.
 */
export type RotateGizmoData<T> = GizmoData<RotateGizmoHandleType, T>;

/**
 * Assets needed to instantiate a {@link RotateGizmoNode}.
 */
export type RotateGizmoNodeResources = GizmoResources<RotateGizmoHandleType>;

/**
 * State associated with an active {@link RotateGizmoNode} interaction.
 */
interface RotateGizmoActiveState extends IGizmoActiveState<RotateGizmoHandleType> {
  initialObjectRotation: Quaternion;
  mutation: SetGameObjectRotationMutation;
  initialClickOffset: Vector3;
}

/**
 * A gizmo that can be used to rotate objects.
 */
export class RotateGizmoNode extends GizmoNodeBase<RotateGizmoHandleType, RotateGizmoActiveState> {
  // Config
  /** Web path to model resource for this gizmo. */
  public static readonly ModelPath = '/resources/models/gizmo-rotate.glb';

  /** Static promise for shared resource loading. */
  private static loadResourcesPromise: Promise<RotateGizmoNodeResources> | undefined;

  public constructor(
    scene: IScene,
    name: string,
    model: Model,
    handleColliders: RotateGizmoData<AxisAlignedBoundingBox | undefined>,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
  ) {
    super(scene, name, model, handleColliders, sceneViewController, parent);

    // Bind material overrides
    model.setMaterialOverride('X', this.materials.x);
    model.setMaterialOverride('Y', this.materials.y);
    model.setMaterialOverride('Z', this.materials.z);
  }

  /**
   * Fired once, when the user clicks on a handle.
   * @param pointer Pointer state.
   * @param type Which type of handle was clicked.
   */
  protected override onInteractBegin(pointer: PointerState, type: RotateGizmoHandleType): void {
    if (pointer.x === undefined || pointer.y === undefined || this.attachedGameObject === undefined) return;

    // Determine pointer's initial offset from gizmo's origin
    let initialClickOffset: Vector3 | undefined = undefined;
    switch (type) {
      case 'x': {
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.YZ);
        break;
      }
      case 'y': {
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XZ);
        break;
      }
      case 'z': {
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XY);
        break;
      }
    }

    if (initialClickOffset === undefined) {
      // @NOTE Theoretically not possible, because the ray cast already collided with a
      // handle collider, so we know the ray cast cannot miss the gizmo plane.
      return;
    }

    // Initialise state
    this.activeState = {
      controlType: type,
      initialObjectRotation: this.attachedGameObject.rotation.q.clone(),
      mutation: new SetGameObjectRotationMutation(this.attachedGameObject.id),
      initialClickOffset,
    };

    // Begin mutation
    void this.sceneViewController.mutatorNew.beginContinuous(this.activeState.mutation);
  }

  /**
   * Fired every frame an interaction is active.
   * @param pointer Pointer state.
   */
  protected override onInteractUpdate(pointer: PointerState): void {
    if (this.activeState === undefined || pointer.x === undefined || pointer.y === undefined || this.attachedGameObject === undefined) return;

    // Look up plane of rotation for gizmo control
    let rotationPlane: GizmoPlane;
    switch (this.activeState.controlType) {
      case 'x': {
        rotationPlane = GizmoPlane.YZ;
        break;
      }
      case 'y': {
        rotationPlane = GizmoPlane.XZ;
        break;
      }
      case 'z': {
        rotationPlane = GizmoPlane.XY;
        break;
      }
      default:
        throw new Error(`Unimplemented ${RotateGizmoNode.name} state control type: '${this.activeState.controlType}'`);
    }

    // Calculate pointer intersection with rotation plane
    const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, rotationPlane);
    if (planeIntersectionPoint !== undefined) {
      // Calculate angle between initial click and plane intersection point
      const axis = GizmoPlaneNormal[rotationPlane];
      const angle = Math.atan2(
        this.activeState.initialClickOffset.cross(planeIntersectionPoint).dot(axis),
        this.activeState.initialClickOffset.dot(planeIntersectionPoint),
      ) * RadiansToDegrees;

      const rotationDelta = Quaternion.fromAxisAngle(axis, angle);

      // Set gizmo orientation
      this.rotation.setValue(rotationDelta);

      // Update mutation
      void this.sceneViewController.mutatorNew.updateContinuous(this.activeState.mutation, {
        rotation: this.activeState.initialObjectRotation.multiply(rotationDelta),
      });
    } else {
      // No intersection with plane - set rotation back to initial value
      void this.sceneViewController.mutatorNew.updateContinuous(this.activeState.mutation, {
        rotation: this.activeState.initialObjectRotation,
      });
      this.rotation.setValue(Quaternion.identity());
      return;
    }
  }

  /**
   * Fired when an interaction ends e.g. the user releases the mouse pointer.
   * @param pointer Pointer state.
   */
  protected override onInteractEnd(_pointer: PointerState): void {
    if (this.activeState === undefined) return;

    // Apply the current mutation
    void this.sceneViewController.mutatorNew.apply(this.activeState.mutation);

    // Reset gizmo & parent to attached object
    if (this.attachedGameObject !== undefined) {
      this.parent.absoluteRotation.q = this.attachedGameObject.absoluteRotation.q;
      this.rotation.setValue(Quaternion.identity());
    }

    this.activeState = undefined;
  }

  /**
   * Create an instance of a {@link RotateGizmoNode} for a scene using previously loaded resources.
   */
  public static async create(
    scene: LoPolyScene,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
    { modelDefinition, handleColliders }: RotateGizmoNodeResources,
  ): Promise<RotateGizmoNode> {
    const gizmoModel = await Model.fromDefinition(scene.engine, modelDefinition);
    const result = new RotateGizmoNode(scene, 'gizmo:rotate', gizmoModel, handleColliders, sceneViewController, parent);
    result.enabled = false;
    return result;
  }

  /**
   * Load assets required by this gizmo, for use in construction later.
   * Instances all share the same resources.
   */
  public static loadResources(): Promise<RotateGizmoNodeResources> {
    return this.loadResourcesPromise ??= this.loadResourcesForGizmo<RotateGizmoHandleType>({
      modelPath: this.ModelPath,
      mapColliderName: (colliderType) => {
        const map: Record<string, RotateGizmoHandleType> = {
          ['X']: 'x',
          ['Y']: 'y',
          ['Z']: 'z',
        };
        return map[colliderType];
      },
    });
  }
}
