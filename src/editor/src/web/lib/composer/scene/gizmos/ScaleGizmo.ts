import { IScene, Scene as LoPolyScene, SceneNode } from '@lopoly/engine/scene';
import { Model } from "@lopoly/engine/models";
import { Vector3 } from "@polyzone/core/math";
import { AxisAlignedBoundingBox, RayCast } from "@lopoly/engine/collision";
import { PointerState } from "@lopoly/engine/input";

import { SetGameObjectScaleMutation } from "@lib/mutation/SceneView/mutations";

import type { ISceneViewController } from "../SceneViewController";
import { GizmoPlane } from './GizmoPlane';
import { GizmoData, GizmoNodeBase, GizmoResources, IGizmoActiveState } from './GizmoBase';

/**
 * Valid properties for data associated with a {@link ScaleGizmoNode}.
 */
export type ScaleGizmoHandleType =
  'all' |
  'x' |
  'y' |
  'z' |
  'xPlane' |
  'yPlane' |
  'zPlane';

/**
 * Object containing data related to a {@link ScaleGizmoNode}.
 */
export type ScaleGizmoData<T> = GizmoData<ScaleGizmoHandleType, T>;

/**
 * Assets needed to instantiate a {@link ScaleGizmoNode}.
 */
export type ScaleGizmoNodeResources = GizmoResources<ScaleGizmoHandleType>;

/**
 * State associated with an active {@link ScaleGizmoNode} interaction.
 */
interface ScaleGizmoActiveState extends IGizmoActiveState<ScaleGizmoHandleType> {
  initialObjectScale: Vector3;
  mutation: SetGameObjectScaleMutation;
  initialClickOffset: Vector3;
}

/**
 * A gizmo that can be used to scale objects.
 */
export class ScaleGizmoNode extends GizmoNodeBase<ScaleGizmoHandleType, ScaleGizmoActiveState> {
  // Config
  /** Web path to model resource for this gizmo. */
  public static readonly ModelPath = '/resources/models/gizmo-scale.glb';
  public static readonly ScaleRate = 1.5;

  /** Static promise for shared resource loading. */
  private static loadResourcesPromise: Promise<ScaleGizmoNodeResources> | undefined;

  public constructor(
    scene: IScene,
    name: string,
    model: Model,
    handleColliders: ScaleGizmoData<AxisAlignedBoundingBox | undefined>,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
  ) {
    super(scene, name, model, handleColliders, sceneViewController, parent);

    // Bind material overrides
    model.setMaterialOverride('White', this.materials.all);
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
  protected override onInteractBegin(pointer: PointerState, type: ScaleGizmoHandleType): void {
    if (pointer.x === undefined || pointer.y === undefined || this.attachedGameObject === undefined) return;

    // Determine pointer's initial offset from gizmo's origin
    let initialClickOffset: Vector3 | undefined = undefined;
    switch (type) {
      case 'all': {
        initialClickOffset = this.rayCastScreenFacingPlane(pointer.x, pointer.y, this.absolutePosition);
        break;
      }
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
      initialObjectScale: this.attachedGameObject.scale.clone(),
      mutation: new SetGameObjectScaleMutation(this.attachedGameObject.id),
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

    /**
     * `newPosition` is calculated in coordinates relative to the gizmo PARENT
     * since the gizmo itself can move around, be scaled, etc.
     */
    let newScaleMultiplier: Vector3 | undefined = undefined;

    switch (this.activeState.controlType) {
      case 'all': {
        const planeIntersectionPoint = this.rayCastScreenFacingPlane(pointer.x, pointer.y, this.absolutePosition);
        if (planeIntersectionPoint !== undefined) {
          const newScale = planeIntersectionPoint.dot(this.activeState.initialClickOffset) / this.activeState.initialClickOffset.lengthSquared();
          newScaleMultiplier = new Vector3(newScale, newScale, newScale);
        }
        break;
      }
      case 'x': {
        const plane = this.determineBestPlaneForAxis('x');
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        if (planeIntersectionPoint !== undefined) {
          newScaleMultiplier = new Vector3(
            1 + Math.sign(this.scale.x) * (planeIntersectionPoint.x - this.activeState.initialClickOffset.x) * ScaleGizmoNode.ScaleRate,
            1,
            1,
          );
        }
        break;
      }
      case 'y': {
        const plane = this.determineBestPlaneForAxis('y');
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        if (planeIntersectionPoint !== undefined) {
          newScaleMultiplier = new Vector3(
            1,
            1 + Math.sign(this.scale.y) * (planeIntersectionPoint.y - this.activeState.initialClickOffset.y) * ScaleGizmoNode.ScaleRate,
            1,
          );
        }
        break;
      }
      case 'z': {
        const plane = this.determineBestPlaneForAxis('z');
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        if (planeIntersectionPoint !== undefined) {
          newScaleMultiplier = new Vector3(
            1,
            1,
            1 + Math.sign(this.scale.z) * (planeIntersectionPoint.z - this.activeState.initialClickOffset.z) * ScaleGizmoNode.ScaleRate,
          );
        }
        break;
      }
      case 'xPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.YZ);
        if (planeIntersectionPoint !== undefined) {
          newScaleMultiplier = new Vector3(
            1,
            1 + Math.sign(this.scale.y) * (planeIntersectionPoint.y - this.activeState.initialClickOffset.y) * ScaleGizmoNode.ScaleRate,
            1 + Math.sign(this.scale.z) * (planeIntersectionPoint.z - this.activeState.initialClickOffset.z) * ScaleGizmoNode.ScaleRate,
          );
        }
        break;
      }
      case 'yPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XZ);
        if (planeIntersectionPoint !== undefined) {
          newScaleMultiplier = new Vector3(
            1 + Math.sign(this.scale.x) * (planeIntersectionPoint.x - this.activeState.initialClickOffset.x) * ScaleGizmoNode.ScaleRate,
            1,
            1 + Math.sign(this.scale.z) * (planeIntersectionPoint.z - this.activeState.initialClickOffset.z) * ScaleGizmoNode.ScaleRate,
          );
        }
        break;
      }
      case 'zPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XY);
        if (planeIntersectionPoint !== undefined) {
          newScaleMultiplier = new Vector3(
            1 + Math.sign(this.scale.x) * (planeIntersectionPoint.x - this.activeState.initialClickOffset.x) * ScaleGizmoNode.ScaleRate,
            1 + Math.sign(this.scale.y) * (planeIntersectionPoint.y - this.activeState.initialClickOffset.y) * ScaleGizmoNode.ScaleRate,
            1,
          );
        }
        break;
      }
      default:
        throw new Error(`Unimplemented ${ScaleGizmoNode.name} state control type: '${this.activeState.controlType}'`);
    }

    if (newScaleMultiplier === undefined) {
      // No result => temporarily reset to initial scale
      void this.sceneViewController.mutatorNew.updateContinuous(this.activeState.mutation, {
        scale: this.activeState.initialObjectScale,
      });
      return;
    }

    void this.sceneViewController.mutatorNew.updateContinuous(this.activeState.mutation, {
      scale: this.activeState.initialObjectScale.scale(newScaleMultiplier),
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

    this.activeState = undefined;
  }

  /**
   * Raycast a point on the screen against a plane facing the camera that
   * intersects {@link planeIntersectionPoint}.
   * The result is the intersection point of the ray with the plane,
   * in coordinates relative to the gizmo parent (NOT the gizmo itself).
   * @param screenX
   * @param screenY
   * @param planeIntersectionPoint World-space coordinate through which the screen-facing plane intersects
   */
  protected rayCastScreenFacingPlane(screenX: number, screenY: number, planeIntersectionPoint: Vector3): Vector3 | undefined {
    const parentWorldToLocal = this.parent.worldMatrix.invert();
    const cameraWorldToLocal = this.sceneViewController.camera.worldMatrix.invert();
    return this.sceneViewController.camera.rayCastFromCamera(screenX, screenY, (_rayOrigin, rayDirection) => {
      // Transform ray into coordinates local to the camera
      // @NOTE It would be redundant to transform `rayOrigin` as it would just become Vector3.zero()
      cameraWorldToLocal.transformDirectionInPlace(rayDirection).normalizeSelf();

      // Calculate distance between camera origin and `planeIntersectionPoint` along
      // camera viewing direction
      const distanceToPlane = cameraWorldToLocal.transformPoint(planeIntersectionPoint).y;

      // Intersect with plane
      const t = distanceToPlane / rayDirection.y;

      if (t > 0) {
        return parentWorldToLocal.transformPointInPlace( // Transform world coordinates to gizmo parent coordinates
          this.sceneViewController.camera.worldMatrix.transformPointInPlace( // Transform camera coordinates to world coordinates
            rayDirection.scale(t), // Compute intersection point in camera coordinates
          ),
        );
      }
    });
  }

  /**
   * Ray cast the gizmo's handle colliders and return which handle the ray hit (if any).
   * The 'all' handle is given special priority over other handles.
   * @param screenX
   * @param screenY
   * @returns The handle type of the collider that the ray hit (if any)
   */
  protected override rayCastHandleColliders(screenX: number, screenY: number): ScaleGizmoHandleType | undefined {
    return this.sceneViewController.camera.rayCastFromCamera(screenX, screenY, (rayOrigin, rayDirection) => {
      let shortestResult: ({ distance: number, type: ScaleGizmoHandleType }) | undefined = undefined;
      for (const colliderType of Object.keys(this.handleColliders) as ScaleGizmoHandleType[]) {
        const collider = this.handleColliders[colliderType];
        if (collider) {
          // Cast against collider
          const rayResult = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);
          if (rayResult !== undefined) {
            // Ray intersects collider
            if (colliderType === 'all') {
              // @NOTE Preferential treatment of 'all' handle
              // If ray intersects it at all - immediately return the result
              return colliderType;
            } else if (shortestResult === undefined || rayResult < shortestResult.distance) {
              // This is the closest result
              shortestResult = {
                distance: rayResult,
                type: colliderType,
              };
            }
          }
        }
      }

      return shortestResult?.type;
    });
  }

  /**
   * Create an instance of a {@link ScaleGizmoNode} for a scene using previously loaded resources.
   */
  public static async create(
    scene: LoPolyScene,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
    { modelDefinition, handleColliders }: ScaleGizmoNodeResources,
  ): Promise<ScaleGizmoNode> {
    const gizmoModel = await Model.fromDefinition(scene.engine, modelDefinition);
    const result = new ScaleGizmoNode(scene, 'gizmo:scale', gizmoModel, handleColliders, sceneViewController, parent);
    result.enabled = false;
    return result;
  }

  /**
   * Load assets required by this gizmo, for use in construction later.
   * Instances all share the same resources.
   */
  public static loadResources(): Promise<ScaleGizmoNodeResources> {
    return this.loadResourcesPromise ??= this.loadResourcesForGizmo<ScaleGizmoHandleType>({
      modelPath: this.ModelPath,
      mapColliderName: (colliderType) => {
        const map: Record<string, ScaleGizmoHandleType> = {
          ['All']: 'all',
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
