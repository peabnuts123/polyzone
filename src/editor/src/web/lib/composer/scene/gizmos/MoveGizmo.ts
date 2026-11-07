import { IScene, Scene as LoPolyScene, SceneNode } from '@lopoly/engine/scene';
import { Model } from "@lopoly/engine/models";
import { Material } from "@lopoly/engine/materials";
import { Quaternion, Vector3 } from "@polyzone/core/math";
import { AxisAlignedBoundingBox } from "@lopoly/engine/collision";
import { PointerState } from "@lopoly/engine/input";

import { SetGameObjectPositionMutation } from "@lib/mutation/SceneView/mutations";

import type { ISceneViewController } from "../SceneViewController";
import { GizmoPlane } from './GizmoPlane';
import { GizmoData, GizmoNodeBase, GizmoResources, IGizmoActiveState } from './GizmoBase';

/**
 * Valid properties for data associated with a {@link MoveGizmoNode}.
 */
export type MoveGizmoHandleType =
  'x' |
  'y' |
  'z' |
  'xPlane' |
  'yPlane' |
  'zPlane';

/**
 * Object containing data related to a {@link MoveGizmoNode}.
 */
export type MoveGizmoData<T> = GizmoData<MoveGizmoHandleType, T>;

/**
 * Assets needed to instantiate a {@link MoveGizmoNode}.
 */
export type MoveGizmoNodeResources = GizmoResources<MoveGizmoHandleType>;

/**
 * State associated with an active {@link MoveGizmoNode} interaction.
 */
interface MoveGizmoActiveState extends IGizmoActiveState<MoveGizmoHandleType> {
  initialObjectPosition: Vector3;
  mutation: SetGameObjectPositionMutation;
  initialClickOffset: Vector3;
}

/**
 * A gizmo that can be used to move objects.
 */
export class MoveGizmoNode extends GizmoNodeBase<MoveGizmoHandleType, MoveGizmoActiveState> {
  // Config
  /** Web path to model resource for this gizmo. */
  public static readonly ModelPath = '/resources/models/gizmo-move.glb';

  /** Static promise for shared resource loading. */
  private static loadResourcesPromise: Promise<MoveGizmoNodeResources> | undefined;

  public constructor(
    scene: IScene,
    name: string,
    model: Model,
    handleColliders: MoveGizmoData<AxisAlignedBoundingBox | undefined>,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
  ) {
    super(scene, name, model, handleColliders, sceneViewController, parent);

    // Bind material overrides
    model.setMaterialOverride('White', new Material({ unlit: true }));
    model.setMaterialOverride('X', this.materials.x);
    model.setMaterialOverride('Y', this.materials.y);
    model.setMaterialOverride('Z', this.materials.z);
    model.setMaterialOverride('XPlane', this.materials.xPlane);
    model.setMaterialOverride('YPlane', this.materials.yPlane);
    model.setMaterialOverride('ZPlane', this.materials.zPlane);
  }

  /**
   * Fired once, when the user clicks on a handle.
   * @param pointer Pointer state.
   * @param type Which type of handle was clicked.
   */
  protected override onInteractBegin(pointer: PointerState, type: MoveGizmoHandleType): void {
    if (pointer.x === undefined || pointer.y === undefined || this.attachedGameObject === undefined) return;

    // Determine pointer's initial offset from gizmo's origin
    let initialClickOffset: Vector3 | undefined = undefined;
    switch (type) {
      case 'x': {
        const plane = this.determineBestPlaneForAxis('x');
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        break;
      }
      case 'y': {
        const plane = this.determineBestPlaneForAxis('y');
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        break;
      }
      case 'z': {
        const plane = this.determineBestPlaneForAxis('z');
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        break;
      }
      case 'xPlane':
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.YZ);
        break;
      case 'yPlane':
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XZ);
        break;
      case 'zPlane':
        initialClickOffset = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XY);
        break;
    }

    if (initialClickOffset === undefined) {
      // @NOTE Theoretically not possible, because the ray cast already collided with a
      // handle collider, so we know the ray cast cannot miss the gizmo plane.
      return;
    }

    // Initialise state
    this.activeState = {
      controlType: type,
      initialObjectPosition: this.attachedGameObject.position.clone(),
      mutation: new SetGameObjectPositionMutation(this.attachedGameObject.id),
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

    const attachedObject = this.attachedGameObject;

    /**
     * `newPosition` is calculated in coordinates relative to the gizmo PARENT
     * since the gizmo itself can move around, be scaled, etc.
     */
    let newPosition: Vector3 | undefined = undefined;

    switch (this.activeState.controlType) {
      case 'x': {
        const plane = this.determineBestPlaneForAxis('x');
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        if (planeIntersectionPoint !== undefined) {
          // Project point to axis in local coordinates
          newPosition = planeIntersectionPoint.subtractSelf(this.activeState.initialClickOffset)
            .setY(0)
            .setZ(0);
        }
        break;
      }
      case 'y': {
        const plane = this.determineBestPlaneForAxis('y');
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        if (planeIntersectionPoint !== undefined) {
          // Project point to axis in local coordinates
          newPosition = planeIntersectionPoint.subtractSelf(this.activeState.initialClickOffset)
            .setX(0)
            .setZ(0);
        }
        break;
      }
      case 'z': {
        const plane = this.determineBestPlaneForAxis('z');
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        if (planeIntersectionPoint !== undefined) {
          // Project point to axis in local coordinates
          newPosition = planeIntersectionPoint.subtractSelf(this.activeState.initialClickOffset)
            .setX(0)
            .setY(0);
        }
        break;
      }
      case 'xPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.YZ);
        if (planeIntersectionPoint !== undefined) {
          newPosition = planeIntersectionPoint.subtractSelf(this.activeState.initialClickOffset);
        }
        break;
      }
      case 'yPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XZ);
        if (planeIntersectionPoint !== undefined) {
          newPosition = planeIntersectionPoint.subtractSelf(this.activeState.initialClickOffset);
        }
        break;
      }
      case 'zPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XY);
        if (planeIntersectionPoint !== undefined) {
          newPosition = planeIntersectionPoint.subtractSelf(this.activeState.initialClickOffset);
        }
        break;
      }
      default:
        throw new Error(`Unimplemented ${MoveGizmoNode.name} state control type: '${this.activeState.controlType}'`);
    }

    if (newPosition === undefined) {
      // No result => temporarily reset to initial position
      void this.sceneViewController.mutatorNew.updateContinuous(this.activeState.mutation, {
        position: this.activeState.initialObjectPosition,
      });
      this.position = Vector3.zero();
      return;
    }

    // Move gizmo instance to new position
    this.position.setValue(newPosition);

    // Convert new position's gizmo-relative coordinates to local space relative to the attached game object
    /* Scale */
    const parentScale = attachedObject.parent?.absoluteScale ?? Vector3.one();
    if (parentScale.x <= Number.EPSILON) console.warn(`[${MoveGizmoNode.name}] (${this.onInteractUpdate.name}) Moving object whose parentScale.x is 0. x coordinate can not be extrapolated and will remain unmodified`);
    else newPosition.x /= parentScale.x;
    if (parentScale.y <= Number.EPSILON) console.warn(`[${MoveGizmoNode.name}] (${this.onInteractUpdate.name}) Moving object whose parentScale.y is 0. y coordinate can not be extrapolated and will remain unmodified`);
    else newPosition.y /= parentScale.y;
    if (parentScale.z <= Number.EPSILON) console.warn(`[${MoveGizmoNode.name}] (${this.onInteractUpdate.name}) Moving object whose parentScale.z is 0. z coordinate can not be extrapolated and will remain unmodified`);
    else newPosition.z /= parentScale.z;

    /* Rotation */
    const parentRotation = attachedObject.parent?.absoluteRotation.qInverse ?? Quaternion.identity();
    this.absoluteRotation.q.rotateVectorInPlace(newPosition);
    parentRotation.rotateVectorInPlace(newPosition);

    void this.sceneViewController.mutatorNew.updateContinuous(this.activeState.mutation, {
      position: this.activeState.initialObjectPosition.add(newPosition),
    });
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
      this.parent.absolutePosition = this.attachedGameObject.absolutePosition;
      this.position = Vector3.zero();
    }

    this.activeState = undefined;
  }

  /**
   * Create an instance of a {@link MoveGizmoNode} for a scene using previously loaded resources.
   */
  public static async create(
    scene: LoPolyScene,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
    { modelDefinition, handleColliders }: MoveGizmoNodeResources,
  ): Promise<MoveGizmoNode> {
    const gizmoModel = await Model.fromDefinition(scene.engine, modelDefinition);
    const result = new MoveGizmoNode(scene, 'gizmo:move', gizmoModel, handleColliders, sceneViewController, parent);
    result.enabled = false;
    return result;
  }

  /**
   * Load assets required by this gizmo, for use in construction later.
   * Instances all share the same resources.
   */
  public static loadResources(): Promise<MoveGizmoNodeResources> {
    return this.loadResourcesPromise ??= this.loadResourcesForGizmo<MoveGizmoHandleType>({
      modelPath: this.ModelPath,
      mapColliderName: (colliderType) => {
        const map: Record<string, MoveGizmoHandleType> = {
          ['X']: 'x',
          ['XPlane']: 'xPlane',
          ['Y']: 'y',
          ['YPlane']: 'yPlane',
          ['Z']: 'z',
          ['ZPlane']: 'zPlane',
        };
        return map[colliderType];
      },
    });
  }
}
