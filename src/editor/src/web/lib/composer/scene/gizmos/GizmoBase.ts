import { BoxColliderNode, IScene, ModelNode, SceneNode } from '@lopoly/engine/scene';
import { Model } from "@lopoly/engine/models";
import { Material } from "@lopoly/engine/materials";
import { AxisAlignedBoundingBox, RayCast } from "@lopoly/engine/collision";
import { IInputSystem, PointerState } from "@lopoly/engine/input";

import { Color4, Vector3 } from "@polyzone/core/math";
import { GameObject } from "@polyzone/runtime/objects";

import { ClaimedPointerCallbacks } from "@lib/common/view";
import type { ISceneViewController } from "../SceneViewController";

import { GizmoConfig } from './config';
import { GizmoPlane } from './GizmoPlane';
import { mapAabbToCollider } from './util';
import { WebFileSystem } from '@lopoly/engine/filesystem';
import { GltfLoader, ModelDefinition, ModelPartDefinition } from '@lopoly/engine/loaders';
import { Transform } from '@lopoly/engine/transform';

export interface LoadResourcesOptions<TGizmoHandleType extends string> {
  modelPath: string;
  mapColliderName: (colliderType: string) => TGizmoHandleType | undefined;
}

export function mapGizmoData<TGizmoHandleTypes extends string, TData, TResult>(data: GizmoData<TGizmoHandleTypes, TData>, mapFn: (datum: TData, type: TGizmoHandleTypes) => TResult): GizmoData<TGizmoHandleTypes, TResult> {
  const result: Partial<GizmoData<TGizmoHandleTypes, TResult>> = {};
  for (const type of Object.keys(data) as TGizmoHandleTypes[]) {
    result[type] = mapFn(data[type], type);
  }
  return result as GizmoData<TGizmoHandleTypes, TResult>;
}

export interface IGizmoActiveState<TGizmoHandleType extends string> {
  controlType: TGizmoHandleType;
}

export type GizmoData<HandleTypes extends string, T> = Record<HandleTypes, T>;

export interface GizmoResources<TGizmoHandleType extends string> {
  modelDefinition: ModelDefinition;
  handleColliders: GizmoData<TGizmoHandleType, AxisAlignedBoundingBox | undefined>;
}

/**
 * Base class for shared logic between gizmos.
 */
export abstract class GizmoNodeBase<TGizmoHandleType extends string, TActiveState extends IGizmoActiveState<TGizmoHandleType>> extends ModelNode {
  // References
  protected readonly sceneViewController: ISceneViewController;
  protected readonly handleColliders: GizmoData<TGizmoHandleType, BoxColliderNode | undefined>;
  protected readonly materials: GizmoData<TGizmoHandleType, Material>;

  // State
  protected attachedGameObject: GameObject | undefined;
  protected activeState: TActiveState | undefined;

  public constructor(
    scene: IScene,
    name: string,
    model: Model,
    handleColliders: GizmoData<TGizmoHandleType, AxisAlignedBoundingBox | undefined>,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
  ) {
    super(scene, name, model, parent);
    this.renderLayer = 1;
    this.sceneViewController = sceneViewController;

    // Map AABB colliders into transformable BoxColliders
    this.handleColliders = mapGizmoData(handleColliders, (aabb, type) => mapAabbToCollider<TGizmoHandleType>(aabb, type, scene, this));

    // Build a map of materials for each handle collider
    this.materials = mapGizmoData(handleColliders, () => new Material({ unlit: true }));
  }

  /**
   * Attach this gizmo to a {@link GameObject}.
   */
  public attachToGameObject(gameObject: GameObject): void {
    this.attachedGameObject = gameObject;
    this.enabled = true;
  }

  /**
   * Detach this gizmo from the current {@link GameObject}.
   */
  public detach(): void {
    this.attachedGameObject = undefined;
    this.enabled = false;
  }

  public override onUpdate(): void {
    if (this.scene.activeCamera) {
      // Calculate camera position in local coordinates
      const worldToLocal = this.parent.worldMatrix.invert();
      const cameraPositionLocal = worldToLocal.transformPoint(this.scene.activeCamera.absolutePosition);
      const distanceToCamera = cameraPositionLocal.length();
      // Maintain gizmo constant screen size + flip gizmo to face camera
      const scale = distanceToCamera / GizmoConfig.FullSizeDistance;
      this.scale.setValue(
        scale * Math.sign(cameraPositionLocal.x),
        scale * Math.sign(cameraPositionLocal.y),
        scale * Math.sign(cameraPositionLocal.z),
      );

      // @DEBUG Draw handle colliders
      // for (const handleType of Object.keys(this.handleColliders) as TGizmoHandleType[]) {
      //   const aabb = this.handleColliders[handleType];
      //   if (aabb) {
      //     this.scene.engine.debugDraw.drawWireframe(aabb, { overlay: true });
      //   }
      // }

      // Update handle collider colors
      let targetGizmoHandleType: TGizmoHandleType | undefined = undefined;
      let targetGizmoHandleColor: Color4 | undefined = undefined;

      if (this.activeState) {
        /* Control is active */
        targetGizmoHandleType = this.activeState.controlType;
        targetGizmoHandleColor = GizmoConfig.HandleActiveColor;
      } else {
        const pointer = this.input.getPointer();

        if (pointer.x !== undefined && pointer.y !== undefined) {
          /* Highlight on mouse over */
          targetGizmoHandleType = this.rayCastHandleColliders(pointer.x, pointer.y);
          targetGizmoHandleColor = GizmoConfig.HandleHighlightColor;
        }
      }

      // Update color overrides for each collider
      for (const materialHandleType of Object.keys(this.materials) as TGizmoHandleType[]) {
        // @NOTE guards to prevent thrashing assignment of the same values all the time
        if (materialHandleType === targetGizmoHandleType) {
          if (this.materials[materialHandleType].diffuseColor !== targetGizmoHandleColor)
            this.materials[materialHandleType].diffuseColor = targetGizmoHandleColor;
        } else {
          if (this.materials[materialHandleType].diffuseColor !== undefined)
            this.materials[materialHandleType].diffuseColor = undefined;
        }
      }
    }
  }

  /**
   * Attempt to handle the camera's click callback.
   * Only consumes the click if the click is on a handle collider.
   */
  public onClickPress(pointer: PointerState): ClaimedPointerCallbacks | undefined {
    if (pointer.x !== undefined && pointer.y !== undefined) {
      const result = this.rayCastHandleColliders(pointer.x, pointer.y);
      if (result !== undefined) {
        this.onInteractBegin(pointer, result);
        return {
          onUpdate: (pointer) => this.onInteractUpdate(pointer),
          onRelease: (pointer) => this.onInteractEnd(pointer),
        };
      }
    }
    return undefined;
  }

  /**
   * Fired once, when the user clicks on a handle.
   * @param pointer Pointer state.
   * @param type Which type of handle was clicked.
   */
  protected abstract onInteractBegin(pointer: PointerState, type: TGizmoHandleType): void;

  /**
   * Fired every frame an interaction is active.
   * @param pointer Pointer state.
   */
  protected abstract onInteractUpdate(pointer: PointerState): void;

  /**
   * Fired when an interaction ends e.g. the user releases the mouse pointer.
   * @param pointer Pointer state.
   */
  protected abstract onInteractEnd(pointer: PointerState): void;

  /**
   * Determine the most orthogonal plane to the camera for a given axis.
   * For example, if looking straight down (or up) the Y axis, the most orthogonal
   * plane for the X axis would be the XZ plane. Whereas looking straight up or down
   * would return the XY plane.
   */
  protected determineBestPlaneForAxis(axis: 'x' | 'y' | 'z'): GizmoPlane {
    // Find the most orthogonal axis to the camera's viewing direction
    // by computing its dot product with the other 2 axes and returning the
    // plane that contains the axis + the most orthogonal axis
    const cameraVector = this.sceneViewController.camera.getViewingDirection();
    switch (axis) {
      case 'x': {
        const dotY = cameraVector.dot(this.worldMatrix.transformDirectionInPlace(new Vector3(0, 1, 0)));
        const dotZ = cameraVector.dot(this.worldMatrix.transformDirectionInPlace(new Vector3(0, 0, 1)));
        return Math.abs(dotY) < Math.abs(dotZ) ? GizmoPlane.XY : GizmoPlane.XZ;
      }
      case 'y': {
        const dotX = cameraVector.dot(this.worldMatrix.transformDirectionInPlace(new Vector3(1, 0, 0)));
        const dotZ = cameraVector.dot(this.worldMatrix.transformDirectionInPlace(new Vector3(0, 0, 1)));
        return Math.abs(dotX) < Math.abs(dotZ) ? GizmoPlane.XY : GizmoPlane.YZ;
      }
      case 'z': {
        const dotX = cameraVector.dot(this.worldMatrix.transformDirectionInPlace(new Vector3(1, 0, 0)));
        const dotY = cameraVector.dot(this.worldMatrix.transformDirectionInPlace(new Vector3(0, 1, 0)));
        return Math.abs(dotX) < Math.abs(dotY) ? GizmoPlane.XZ : GizmoPlane.YZ;
      }
    }
  }

  /**
   * Raycast a point on the screen against a plane relative to the gizmo.
   * The result is the intersection point of the ray with the given plane,
   * in coordinates relative to the gizmo parent (NOT the gizmo itself).
   * @param screenX
   * @param screenY
   * @param plane
   */
  protected rayCastGizmoPlane(screenX: number, screenY: number, plane: GizmoPlane): Vector3 | undefined {
    const worldToLocal = this.parent.worldMatrix.invert();
    return this.sceneViewController.camera.rayCastFromCamera(screenX, screenY, (rayOrigin, rayDirection) => {
      // Transform ray into local coordinates
      rayOrigin = worldToLocal.transformPoint(rayOrigin);
      worldToLocal.transformDirectionInPlace(rayDirection).normalizeSelf();

      // Intersect with plane
      let t: number;
      switch (plane) {
        case GizmoPlane.XY:
          t = -rayOrigin.z / rayDirection.z;
          break;
        case GizmoPlane.XZ:
          t = -rayOrigin.y / rayDirection.y;
          break;
        case GizmoPlane.YZ:
          t = -rayOrigin.x / rayDirection.x;
          break;
      }

      if (t > 0) {
        const intersectionPoint = rayDirection.scale(t).addSelf(rayOrigin);
        return intersectionPoint;
      }
    });
  }

  /**
   * Ray cast the gizmo's handle colliders and return which handle the ray hit (if any).
   * @param screenX
   * @param screenY
   * @returns The handle type of the collider that the ray hit (if any)
   */
  protected rayCastHandleColliders(screenX: number, screenY: number): TGizmoHandleType | undefined {
    return this.sceneViewController.camera.rayCastFromCamera(screenX, screenY, (rayOrigin, rayDirection) => {
      let shortestResult: ({ distance: number, type: TGizmoHandleType }) | undefined = undefined;
      for (const colliderType of Object.keys(this.handleColliders) as TGizmoHandleType[]) {
        const collider = this.handleColliders[colliderType];
        if (collider) {
          // Cast against collider
          const rayResult = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);
          if (rayResult !== undefined && (shortestResult === undefined || rayResult < shortestResult.distance)) {
            // This is the closest result
            shortestResult = {
              distance: rayResult,
              type: colliderType,
            };
          }
        }
      }

      return shortestResult?.type;
    });
  }

  // @TODO Should this live somewhere better? Surely on project controller or something
  private static webFileSystem = new WebFileSystem();
  // @TODO Rename
  protected static async loadResourcesForGizmo<TGizmoHandleType extends string>({ modelPath, mapColliderName }: LoadResourcesOptions<TGizmoHandleType>): Promise<GizmoResources<TGizmoHandleType>> {
    const modelDefinition = await GltfLoader.loadModel(modelPath, this.webFileSystem);

    const handleColliders: Partial<GizmoData<TGizmoHandleType, AxisAlignedBoundingBox>> = {
      // x: undefined,
      // y: undefined,
      // z: undefined,
      // xPlane: undefined,
      // yPlane: undefined,
      // zPlane: undefined,
    };

    // Model parts to remove from the model definition
    const toRemove: { part: ModelPartDefinition, collection: ModelPartDefinition[] }[] = [];

    // Walk model part looking for parts named "Collider_*"
    // Create a Collider based on the part's extents, then remove it from the model
    async function walkModelParts(part: ModelPartDefinition, parentPart?: ModelPartDefinition, parentTransform?: Transform<ModelPartDefinition>): Promise<void> {
      const partTransform = new Transform(part, parentTransform);
      partTransform.position = part.transform.position;
      partTransform.rotation.q = part.transform.rotation;
      partTransform.scale = part.transform.scale;

      // If part called Collider_*, convert to collider
      if (part.name.startsWith('Collider_') && part.mesh) {
        // Compute AABB for mesh
        const colliderAABB = AxisAlignedBoundingBox.zero();
        for (const primitive of part.mesh.primitives) {
          colliderAABB.unionSelf(primitive.extents);
        }
        colliderAABB.transformSelf(partTransform.worldMatrix); // @NOTE worldMatrix is already absolute

        const colliderType = part.name.replace(/^Collider_/, '');

        const handleType = mapColliderName(colliderType);
        if (handleType === undefined) {
          console.warn(`[${GizmoNodeBase.name}] (${walkModelParts.name}) Unhandled collider mesh (name='${part.name}')`);
        } else {
          handleColliders[handleType] = colliderAABB;
        }

        // Remove from model definition
        if (parentPart !== undefined) {
          toRemove.push({
            part,
            collection: parentPart.children,
          });
        } else {
          toRemove.push({
            part,
            collection: modelDefinition.rootParts,
          });
        }
      }

      // Walk children
      for (const childPart of part.children) {
        await walkModelParts(childPart, part, partTransform);
      };
    }

    // Walk scene root objects
    for (const rootPart of modelDefinition.rootParts) {
      await walkModelParts(rootPart);
    }

    // Remove model parts converted to colliders
    for (const { part, collection } of toRemove) {
      collection.splice(collection.indexOf(part), 1);
    }

    return {
      modelDefinition,
      handleColliders: handleColliders as GizmoData<TGizmoHandleType, AxisAlignedBoundingBox | undefined>,
    };
  }

  private get input(): IInputSystem { return this.scene.engine.inputSystem; }

  public override get parent(): SceneNode { return super.parent!; }
  public override set parent(value: SceneNode) { super.parent = value; }
}
