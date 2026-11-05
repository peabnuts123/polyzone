import { makeAutoObservable } from "mobx";
import { BoxColliderNode, IScene, Scene as LoPolyScene, ModelNode, ObjectNode, SceneNode } from '@lopoly/engine/scene';
import { Model } from "@lopoly/engine/models";
import { Enum } from '@lopoly/engine/util/types';
import { GltfLoader, ModelDefinition, ModelPartDefinition } from "@lopoly/engine/loaders";
import { WebFileSystem } from "@lopoly/engine/filesystem";
import { Material } from "@lopoly/engine/materials";
import { Color4, Quaternion, Vector3 } from "@polyzone/core/math";
import { Transform } from "@lopoly/engine/transform";
import { AxisAlignedBoundingBox, RayCast } from "@lopoly/engine/collision";
import { IInputSystem, PointerState } from "@lopoly/engine/input";

import { SetGameObjectPositionMutation, SetGameObjectRotationMutation, SetGameObjectScaleMutation } from "@lib/mutation/SceneView/mutations";
import type { ISceneViewController } from "./SceneViewController";
import { ClaimedPointerCallbacks } from "@lib/common/view";
import { GameObject } from "@polyzone/runtime/objects";

export const CurrentSelectionTool = {
  Move: 'move',
  Rotate: 'rotate',
  Scale: 'scale',
} as const;
export type CurrentSelectionTool = Enum<typeof CurrentSelectionTool>;

export interface SelectionManagerResources {
  moveGizmo: MoveGizmoNodeResources;
}

export class SelectionManager {
  // private readonly lopolyScene: LoPolyScene;
  private readonly sceneViewController: ISceneViewController;

  private gizmoParent: ObjectNode;
  private moveGizmo: MoveGizmoNode | undefined;
  // private static MoveGizmoModel: Promise<Model>;

  // private readonly gizmoManager: GizmoManager;
  // private readonly moveGizmo: PositionGizmo;
  // private readonly rotateGizmo: RotationGizmo;
  // private readonly scaleGizmo: ScaleGizmo;
  // private readonly boundingBoxGizmo: BoundingBoxGizmo;

  private _currentTool: CurrentSelectionTool = CurrentSelectionTool.Move;
  private _selectedObjectId: string | undefined = undefined;
  // private fakeTransformTarget: TransformNode | undefined = undefined;

  // private currentMoveMutation: SetGameObjectPositionMutation | undefined = undefined;
  // private currentRotateMutation: SetGameObjectRotationMutation | undefined = undefined;
  // private currentScaleMutation: SetGameObjectScaleMutation | undefined = undefined;

  // private debug_moveGizmo: GizmoNode;

  public constructor(
    lopolyScene: LoPolyScene,
    sceneViewController: ISceneViewController,
    resources: SelectionManagerResources) {
    this.sceneViewController = sceneViewController;

    this.gizmoParent = new ObjectNode(lopolyScene, 'gizmo:parent');
    // @NOTE Load gizmos asynchronously. They have just a little bit of model loading
    // to perform. We can't do this up front because it depends on LoPoly IEngine which
    // is captured in ViewController and only instantiated AFTER SceneViewController is created.
    // We also need the inverse reference to SceneViewController.
    // So we have little choice but to do this work asynchronously in the constructor.
    const gizmoLoadStart = performance.now();
    void MoveGizmoNode.create(lopolyScene, sceneViewController, this.gizmoParent, resources.moveGizmo).then((moveGizmo) => {
      const moveGizmoLoadStop = performance.now();
      console.log(`Loaded MoveGizmo in ${moveGizmoLoadStop - gizmoLoadStart}ms`);
      this.moveGizmo = moveGizmo;
    });

    // // Rotate
    // this.rotateGizmo = new RotationGizmo(utilityLayer, 32, true, 6, this.gizmoManager);
    // this.rotateGizmo.onDragStartObservable.add(() => {
    //   this.currentRotateMutation = new SetGameObjectRotationMutation(this.selectedObjectId!);
    //   void sceneViewController.mutatorNew.beginContinuous(this.currentRotateMutation);
    // });
    // this.rotateGizmo.onDragObservable.add((_eventData) => {
    //   if (this.selectedObjectId !== undefined) {
    //     // Sometimes the rotation comes down as a quaternion, and sometimes not.
    //     // At this stage, I don't really know why ¯\_(ツ)_/¯
    //     const rotation = this.fakeTransformTarget!.rotationQuaternion!;
    //     if (this.fakeTransformTarget!.rotationQuaternion === null) {
    //       throw new Error(`Rotation quaternion is undefined somehow`);
    //     }

    //     void sceneViewController.mutatorNew.updateContinuous(this.currentRotateMutation!, {
    //       rotation: toQuaternionCore(rotation),
    //     });
    //   }
    // });
    // this.rotateGizmo.onDragEndObservable.add((_eventData) => {
    //   void sceneViewController.mutatorNew.apply(this.currentRotateMutation!);
    //   this.currentRotateMutation = undefined;
    // });

    // // Scale
    // this.scaleGizmo = new ScaleGizmo(utilityLayer, 2, this.gizmoManager);
    // this.scaleGizmo.onDragStartObservable.add(() => {
    //   this.currentScaleMutation = new SetGameObjectScaleMutation(this.selectedObjectId!);
    //   void sceneViewController.mutatorNew.beginContinuous(this.currentScaleMutation);
    // });
    // this.scaleGizmo.onDragObservable.add((_eventData) => {
    //   if (this.selectedObjectId !== undefined) {
    //     // Scaling is handled as a percentage to accommodate rotation
    //     void sceneViewController.mutatorNew.updateContinuous(this.currentScaleMutation!, {
    //       scaleDelta: toVector3Core(this.fakeTransformTarget!.scaling),
    //     });
    //     // @NOTE Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
    //     this.fakeTransformTarget!.scaling = Vector3Babylon.One();
    //   }
    // });
    // this.scaleGizmo.onDragEndObservable.add(() => {
    //   void sceneViewController.mutatorNew.apply(this.currentScaleMutation!);
    //   this.currentScaleMutation = undefined;
    // });

    // // Bounding box
    // this.boundingBoxGizmo = new BoundingBoxGizmo(Color3.Yellow(), utilityLayer);
    // this.boundingBoxGizmo.setEnabledScaling(false);
    // this.boundingBoxGizmo.setEnabledRotationAxis("");

    this.updateGizmos();

    makeAutoObservable(this);
  }

  public onClickPress(pointer: PointerState): ClaimedPointerCallbacks | undefined {
    if (this.currentGizmo !== undefined) {
      return this.currentGizmo.onClickPress(pointer);
    }
  }

  public static async loadResources(): Promise<SelectionManagerResources> {
    return {
      moveGizmo: await MoveGizmoNode.loadResources(),
    };
  }


  public select(gameObjectId: string): void {
    this.selectedObjectId = gameObjectId;
  }

  public deselectAll(): void {
    this.selectedObjectId = undefined;
  }

  public updateGizmos(): void {
    // @NOTE If gizmos haven't loaded, no-op (shouldn't really ever happen)
    if (
      this.moveGizmo === undefined
    ) return;

    // Clear all gizmos
    this.moveGizmo.detach();
    // this.moveGizmo.enabled = false;
    // this.moveGizmo.attachedNode = null;
    // this.rotateGizmo.attachedNode = null;
    // this.scaleGizmo.attachedNode = null;
    // this.boundingBoxGizmo.attachedMesh = null;

    if (this.selectedObjectId !== undefined) {
      const selectedObjectInstance = this.sceneViewController.findGameObjectById(this.selectedObjectId);
      if (selectedObjectInstance === undefined) throw new Error(`Cannot update gizmos, no game object exists in the scene with id '${this.selectedObjectId}'`);
      //   const realTransformTarget = selectedObjectInstance.transform.node;

      //   // Construct a new dummy transform target if we need one and it doesn't exist
      //   if (this.fakeTransformTarget === undefined) {
      //     this.fakeTransformTarget = new TransformNode("SelectionManager_fakeTransformTarget", this.babylonScene);
      //     this.fakeTransformTarget.rotationQuaternion = QuaternionBabylon.Identity();
      //   }

      //   // Ensure fake transform target's local coordinates match the local coordinates of the
      //   // real transform target by giving it a dummy parent transform
      //   let parentScale = Vector3Babylon.One();
      //   if (realTransformTarget.parent !== null) {
      //     const realParent = realTransformTarget.parent as TransformNode;
      //     parentScale = realParent.absoluteScaling;
      //     if (this.fakeTransformTarget.parent === null) {
      //       // Creating a new fake transform parent
      //       const fakeParent = new TransformNode(`SelectionManager_fakeTransformParent`, this.babylonScene);
      //       fakeParent.position = realParent.absolutePosition.clone();
      //       fakeParent.rotationQuaternion = realParent.absoluteRotationQuaternion.clone();
      //       this.fakeTransformTarget.parent = fakeParent;
      //     } else {
      //       // Re-using an existing fake transform parent
      //       const fakeParent = this.fakeTransformTarget.parent as TransformNode;
      //       fakeParent.position = realParent.absolutePosition.clone();
      //       fakeParent.rotationQuaternion = realParent.absoluteRotationQuaternion.clone();
      //     }
      //   } else {
      //     // No fake transform parent
      //     this.fakeTransformTarget.parent = null;
      //   }

      // Position gizmos on selection target
      this.gizmoParent.absolutePosition = selectedObjectInstance.absolutePosition;
      this.gizmoParent.absoluteRotation.q = selectedObjectInstance.absoluteRotation.q;
      //   // Position dummy transform target on the selection target
      //   this.fakeTransformTarget.position = realTransformTarget.position.multiply(parentScale);
      //   this.fakeTransformTarget.rotationQuaternion = (realTransformTarget.rotationQuaternion ?? realTransformTarget.rotation.toQuaternion()).clone();
      //   // Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
      //   // Scaling is done as a percentage to accommodate this
      //   this.fakeTransformTarget.scaling = Vector3Babylon.One();

      //   // Enable bounding box
      //   // @NOTE Type laundering (huff my duff, Babylon))
      //   this.boundingBoxGizmo.attachedMesh = realTransformTarget as AbstractMesh;

      // Enable only the current tool
      // this.currentGizmo!.enabled = true;
      this.currentGizmo?.attachToGameObject(selectedObjectInstance);
      // switch (this.currentTool) {
      //   case CurrentSelectionTool.Move:
      //     // this.moveGizmo.attachedNode = this.fakeTransformTarget;
      //     this.moveGizmo.enabled = true;
      //     break;
      //   case CurrentSelectionTool.Rotate:
      //     // this.rotateGizmo.attachedNode = this.fakeTransformTarget;
      //     break;
      //   case CurrentSelectionTool.Scale:
      //     // this.scaleGizmo.attachedNode = this.fakeTransformTarget;
      //     break;
      //   default:
      //     console.error(`[${SelectionManager.name}] (${this.updateGizmos.name}) Unimplemented tool type: ${this.currentTool}`);
      // }
    } else {
      // Destroy dummy transform target if we've deselected
      // this.fakeTransformTarget?.parent?.dispose();
      // this.fakeTransformTarget?.dispose();
      // this.fakeTransformTarget = undefined;
    }
  }

  public destroy(): void {
    // this.moveGizmo.dispose();
    // this.rotateGizmo.dispose();
    // this.scaleGizmo.dispose();
    // this.boundingBoxGizmo.dispose();
    // this.gizmoManager.dispose();
  }

  // Selected object
  public get selectedObjectId(): string | undefined {
    return this._selectedObjectId;
  }
  private set selectedObjectId(value: string | undefined) {
    this._selectedObjectId = value;
    this.updateGizmos();
  }

  // Current tool
  public get currentTool(): CurrentSelectionTool {
    return this._currentTool;
  }
  public set currentTool(value: CurrentSelectionTool) {
    this._currentTool = value;
    this.updateGizmos();
  }

  public get currentGizmo(): MoveGizmoNode | undefined {
    if (this.selectedObjectId !== undefined) {
      switch (this.currentTool) {
        case CurrentSelectionTool.Move:
          return this.moveGizmo;
        case CurrentSelectionTool.Rotate:
          return undefined; // @TODO
        case CurrentSelectionTool.Scale:
          return undefined; // @TODO
        default:
          console.error(`[${SelectionManager.name}] (currentGizmo) Unimplemented tool type: ${this.currentTool}`);
      }
    }
  }
}

/* GIZMO */
export interface GizmoData<T> {
  x: T;
  y: T;
  z: T;
  xPlane: T;
  yPlane: T;
  zPlane: T;
}
export type GizmoColliderType = keyof GizmoData<any>;
export function mapGizmoData<TData, TResult>(data: GizmoData<TData>, mapFn: (datum: TData, type: GizmoColliderType) => TResult): GizmoData<TResult> {
  return {
    x: mapFn(data.x, 'x'),
    y: mapFn(data.y, 'y'),
    z: mapFn(data.z, 'z'),
    xPlane: mapFn(data.xPlane, 'xPlane'),
    yPlane: mapFn(data.yPlane, 'yPlane'),
    zPlane: mapFn(data.zPlane, 'zPlane'),
  };
}
export const GizmoPlane = {
  XY: 'XY',
  XZ: 'XZ',
  YZ: 'YZ',
} as const;
export type GizmoPlane = Enum<typeof GizmoPlane>;

/* MOVE GIZMO */
export interface MoveGizmoNodeResources {
  modelDefinition: ModelDefinition;
  colliders: GizmoData<AxisAlignedBoundingBox | undefined>;
}
interface MoveGizmoActiveState {
  controlType: GizmoColliderType;
  initialObjectPosition: Vector3;
  mutation: SetGameObjectPositionMutation;
  initialClickOffset: Vector3;
}
export class MoveGizmoNode extends ModelNode {
  // Config
  /**
   * Distance at which the model is at 100% scale.
   * Smaller numbers = bigger on-screen size.
   * Larger numbers = smaller on-screen size.
   */
  private static readonly FullSizeDistance = 18;
  /** Web path to model resource for this gizmo. */
  public static readonly ModelPath = '/resources/models/gizmo-move.glb';
  /**
   * Collider group for all the gizmo's collider instances.
   * Every collider must have a group (for collision calculations). Even though
   * we don't expect there to ever be any collision calculations within the editor,
   * we pick a group that's out of the way.
   */
  private static readonly GizmoColliderGroup = 1;
  /** Color that the gizmo handles will be when highlighted by the mouse. */
  private static readonly HighlightedColor = Color4.yellow();
  /** Color that the gizmo handles will be when actively being used. */
  private static readonly ActiveColor = Color4.yellow();

  private static loadResourcesPromise: Promise<MoveGizmoNodeResources> | undefined;

  // References
  private readonly sceneViewController: ISceneViewController;
  private readonly colliders: GizmoData<BoxColliderNode | undefined>;
  private readonly materials: GizmoData<Material>;

  // State
  private attachedGameObject: GameObject | undefined;
  private activeMoveState: MoveGizmoActiveState | undefined;

  public constructor(
    scene: IScene,
    name: string,
    model: Model,
    gizmoColliders: GizmoData<AxisAlignedBoundingBox | undefined>,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
  ) {
    super(scene, name, model, parent);
    this.renderLayer = 1;
    this.sceneViewController = sceneViewController;

    // Map AABB colliders into transformable BoxColliders
    this.colliders = mapGizmoData(gizmoColliders, (aabb, type) => {
      if (aabb) {
        const collider = new BoxColliderNode(
          scene,
          `${name}:collider_${type}`,
          MoveGizmoNode.GizmoColliderGroup,
          {
            x: aabb.xMax - aabb.xMin,
            y: aabb.yMax - aabb.yMin,
            z: aabb.zMax - aabb.zMin,
          },
          this,
        );
        collider.position.x = (aabb.xMin + aabb.xMax) / 2;
        collider.position.y = (aabb.yMin + aabb.yMax) / 2;
        collider.position.z = (aabb.zMin + aabb.zMax) / 2;
        return collider;
      }
    });

    // Build a map of materials for each collider handle
    this.materials = {
      x: new Material({ unlit: true, diffuseColor: Color4.fuchsia() }),
      y: new Material({ unlit: true }),
      z: new Material({ unlit: true }),
      xPlane: new Material({ unlit: true }),
      yPlane: new Material({ unlit: true }),
      zPlane: new Material({ unlit: true }),
    };
    model.setMaterialOverride('White', new Material({ unlit: true }));
    model.setMaterialOverride('X', this.materials.x);
    model.setMaterialOverride('Y', this.materials.y);
    model.setMaterialOverride('Z', this.materials.z);
    model.setMaterialOverride('XPlane', this.materials.xPlane);
    model.setMaterialOverride('YPlane', this.materials.yPlane);
    model.setMaterialOverride('ZPlane', this.materials.zPlane);
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

  private tmp_onUpdateDeltaCamera: Vector3 = Vector3.zero();
  public override onUpdate(): void {
    if (this.scene.activeCamera) {
      // Maintain gizmo constant screen size
      const distanceToCamera = this.tmp_onUpdateDeltaCamera.setValue(this.scene.activeCamera.absolutePosition)
        .subtractSelf(this.absolutePosition)
        .length();
      const scale = distanceToCamera / MoveGizmoNode.FullSizeDistance;
      this.scale.setValue(scale, scale, scale);

      // // @DEBUG Draw colliders
      // for (const colliderType of Object.keys(this.colliders) as GizmoColliderType[]) {
      //   const aabb = this.colliders[colliderType];
      //   if (aabb) {
      //     this.scene.engine.debugDraw.drawWireframe(aabb, { overlay: true });
      //   }
      // }

      // Update collider handle colors
      let targetGizmoColliderType: GizmoColliderType | undefined = undefined;
      let targetGizmoColliderColor: Color4 | undefined = undefined;

      if (this.activeMoveState) {
        /* Control is active */
        targetGizmoColliderType = this.activeMoveState.controlType;
        targetGizmoColliderColor = MoveGizmoNode.ActiveColor;
      } else {
        const pointer = this.input.getPointer();

        if (pointer.x !== undefined && pointer.y !== undefined) {
          /* Highlight on mouse over */
          targetGizmoColliderType = this.rayCastColliders(pointer.x, pointer.y);
          targetGizmoColliderColor = MoveGizmoNode.HighlightedColor;
        }
      }

      // Update color overrides for each collider
      for (const materialType of Object.keys(this.materials) as GizmoColliderType[]) {
        // @NOTE guards to prevent thrashing assignment of the same values all the time
        if (materialType === targetGizmoColliderType) {
          // if (this.materials[materialType].diffuseColor !== targetGizmoColliderColor)
          this.materials[materialType].diffuseColor = targetGizmoColliderColor;
        } else {
          // if (this.materials[materialType].diffuseColor !== undefined)
          this.materials[materialType].diffuseColor = undefined;
        }
      }
    }
  }

  /**
   * Create instance of {@link MoveGizmo} for scene using previously loaded resources.
   */
  public static async create(
    scene: LoPolyScene,
    sceneViewController: ISceneViewController,
    parent: SceneNode,
    { modelDefinition, colliders }: MoveGizmoNodeResources,
  ): Promise<MoveGizmoNode> {
    const gizmoModel = await Model.fromDefinition(scene.engine, modelDefinition);
    const result = new MoveGizmoNode(scene, 'gizmo:move', gizmoModel, colliders, sceneViewController, parent);
    result.enabled = false;
    return result;
  }

  /**
   * Attempt to handle the camera's click callback.
   * Only consumes the click if the click is on a handler collider.
   */
  public onClickPress(pointer: PointerState): ClaimedPointerCallbacks | undefined {
    if (pointer.x !== undefined && pointer.y !== undefined) {
      const result = this.rayCastColliders(pointer.x, pointer.y);
      if (result !== undefined) {
        this.onBeginMove(pointer, result);
        return {
          onUpdate: (pointer) => this.onMoveUpdate(pointer),
          onRelease: (pointer) => this.onMoveEnd(pointer),
        };
      }
    }
    return undefined;
  }

  /**
   * Fired once, when the user clicks on a handle collider.
   * @param pointer Pointer state.
   * @param type Which type of handle was clicked.
   */
  private onBeginMove(pointer: PointerState, type: GizmoColliderType): void {
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

    // Initialise move state
    this.activeMoveState = {
      controlType: type,
      initialObjectPosition: this.attachedGameObject.position.clone(),
      mutation: new SetGameObjectPositionMutation(this.attachedGameObject.id),
      initialClickOffset,
    };

    // Begin mutation
    void this.sceneViewController.mutatorNew.beginContinuous(this.activeMoveState.mutation);
  }

  /**
   * Fired every frame a move operation is active.
   * @param pointer Pointer state.
   */
  private onMoveUpdate(pointer: PointerState): void {
    if (this.activeMoveState === undefined || pointer.x === undefined || pointer.y === undefined || this.attachedGameObject === undefined) return;

    const attachedObject = this.attachedGameObject;

    /**
     * `newPosition` is calculated in coordinates relative to the gizmo PARENT
     * since the gizmo itself can move around, be scaled, etc.
     */
    let newPosition: Vector3 | undefined = undefined;

    switch (this.activeMoveState.controlType) {
      case 'x': {
        const plane = this.determineBestPlaneForAxis('x');
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, plane);
        if (planeIntersectionPoint !== undefined) {
          // Project point to axis in local coordinates
          newPosition = planeIntersectionPoint.subtractSelf(this.activeMoveState.initialClickOffset)
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
          newPosition = planeIntersectionPoint.subtractSelf(this.activeMoveState.initialClickOffset)
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
          newPosition = planeIntersectionPoint.subtractSelf(this.activeMoveState.initialClickOffset)
            .setX(0)
            .setY(0);
        }
        break;
      }
      case 'xPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.YZ);
        if (planeIntersectionPoint !== undefined) {
          newPosition = planeIntersectionPoint.subtractSelf(this.activeMoveState.initialClickOffset);
        }
        break;
      }
      case 'yPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XZ);
        if (planeIntersectionPoint !== undefined) {
          newPosition = planeIntersectionPoint.subtractSelf(this.activeMoveState.initialClickOffset);
        }
        break;
      }
      case 'zPlane': {
        const planeIntersectionPoint = this.rayCastGizmoPlane(pointer.x, pointer.y, GizmoPlane.XY);
        if (planeIntersectionPoint !== undefined) {
          newPosition = planeIntersectionPoint.subtractSelf(this.activeMoveState.initialClickOffset);
        }
        break;
      }
      default:
        throw new Error(`Unimplemented move state control type: '${this.activeMoveState.controlType}'`);
    }

    // @TODO Draw a line along the current axis or axes

    if (newPosition === undefined) {
      // No result => temporarily reset to initial position
      void this.sceneViewController.mutatorNew.updateContinuous(this.activeMoveState.mutation, {
        position: this.activeMoveState.initialObjectPosition,
      });
      this.position = Vector3.zero();
      return;
    }

    // Move gizmo instance to new position
    this.position.setValue(newPosition);

    // Convert new position's gizmo-relative coordinates to local space relative to the attached game object
    /* Scale */
    const parentScale = attachedObject.parent?.absoluteScale ?? Vector3.one();
    if (parentScale.x <= Number.EPSILON) console.warn(`[${MoveGizmoNode.name}] (${this.onMoveUpdate.name}) Moving object whose parentScale.x is 0. x coordinate can not be extrapolated and will remain unmodified`);
    else newPosition.x /= parentScale.x;
    if (parentScale.y <= Number.EPSILON) console.warn(`[${MoveGizmoNode.name}] (${this.onMoveUpdate.name}) Moving object whose parentScale.y is 0. y coordinate can not be extrapolated and will remain unmodified`);
    else newPosition.y /= parentScale.y;
    if (parentScale.z <= Number.EPSILON) console.warn(`[${MoveGizmoNode.name}] (${this.onMoveUpdate.name}) Moving object whose parentScale.z is 0. z coordinate can not be extrapolated and will remain unmodified`);
    else newPosition.z /= parentScale.z;

    /* Rotation */
    const parentRotation = attachedObject.parent?.absoluteRotation.qInverse ?? Quaternion.identity();
    this.absoluteRotation.q.rotateVectorInPlace(newPosition);
    parentRotation.rotateVectorInPlace(newPosition);

    void this.sceneViewController.mutatorNew.updateContinuous(this.activeMoveState.mutation, {
      position: this.activeMoveState.initialObjectPosition.add(newPosition),
    });;
  }

  /**
   * Fired when a movement interaction ends e.g. the user releases the mouse pointer
   */
  private onMoveEnd(_pointer: PointerState): void {
    if (this.activeMoveState === undefined) return;

    // Apply the current mutation
    void this.sceneViewController.mutatorNew.apply(this.activeMoveState.mutation);

    // Reset gizmo & parent to attached object
    if (this.attachedGameObject !== undefined) {
      this.parent.absolutePosition = this.attachedGameObject.absolutePosition;
      this.position = Vector3.zero();
    }

    this.activeMoveState = undefined;
  }

  /**
   * Determine the most orthogonal plane to the camera for a given axis.
   * For example, if looking straight down (or up) the Y axis, the most orthogonal
   * plane for the X axis would be the XZ plane. Whereas looking straight up or down
   * would return the XY plane.
   */
  private determineBestPlaneForAxis(axis: 'x' | 'y' | 'z'): GizmoPlane {
    // Find the most orthogonal axis to the camera's viewing direction
    // by computing its dot product with the other 2 axes and returning the
    // plane that contains the axis + the most orthogonal axis
    return this.sceneViewController.camera.rayCastFromCamera(
      this.scene.engine.canvas.width / 2,
      this.scene.engine.canvas.height / 2,
      (_, cameraVector) => {
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
      },
    );
  }

  /**
   * Raycast a point on the screen against a plane relative to the gizmo.
   * The result is the intersection point of the ray with the given plane,
   * in coordinates relative to the gizmo parent (NOT the gizmo itself).
   * @param screenX
   * @param screenY
   * @param plane
   */
  private rayCastGizmoPlane(screenX: number, screenY: number, plane: GizmoPlane): Vector3 | undefined {
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
   * Ray cast the gizmo's colliders i.e. all the "handles" on the tool,
   * and return whichever collider the ray hit (if any).
   * @param screenX
   * @param screenY
   * @returns The type ID of the collider that the ray collided with (if any)
   */
  private rayCastColliders(screenX: number, screenY: number): GizmoColliderType | undefined {
    return this.sceneViewController.camera.rayCastFromCamera(screenX, screenY, (rayOrigin, rayDirection) => {
      let shortestResult: ({ distance: number, type: GizmoColliderType }) | undefined = undefined;
      for (const colliderType of Object.keys(this.colliders) as GizmoColliderType[]) {
        const collider = this.colliders[colliderType];
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

  /**
   * Load assets required by this gizmo, for use in construction later.
   * Instances all share the same resources.
   */
  public static loadResources(): Promise<MoveGizmoNodeResources> {
    if (this.loadResourcesPromise === undefined) {
      this.loadResourcesPromise = this.__loadResources();
    }
    return this.loadResourcesPromise;
  }
  private static async __loadResources(): Promise<MoveGizmoNodeResources> {
    const debug_editorFileSystem = new WebFileSystem();
    const modelDefinition = await GltfLoader.loadModel(this.ModelPath, debug_editorFileSystem);

    const colliders: GizmoData<AxisAlignedBoundingBox | undefined> = {
      x: undefined,
      y: undefined,
      z: undefined,
      xPlane: undefined,
      yPlane: undefined,
      zPlane: undefined,
    };

    // Model parts to remove from the model definition
    const toRemove: { part: ModelPartDefinition, collection: ModelPartDefinition[] }[] = [];

    // Walk model part looking for parts named "Collider*"
    // Create a Collider based on the part's extents, then remove it from the model
    async function walkModelParts(part: ModelPartDefinition, parentPart?: ModelPartDefinition, parentTransform?: Transform<ModelPartDefinition>): Promise<void> {
      const partTransform = new Transform(part, parentTransform);
      partTransform.position = part.transform.position;
      partTransform.rotation.q = part.transform.rotation;
      partTransform.scale = part.transform.scale;

      // If part called Collider*, convert to collider
      if (part.name.startsWith('Collider_') && part.mesh) {
        // Compute AABB for mesh
        const colliderAABB = AxisAlignedBoundingBox.zero();
        for (const primitive of part.mesh.primitives) {
          colliderAABB.unionSelf(primitive.extents);
        }
        colliderAABB.transformSelf(partTransform.worldMatrix); // @NOTE worldMatrix is already absolute

        const colliderType = part.name.replace(/^Collider_/, '');
        switch (colliderType) {
          case 'X':
            colliders['x'] = colliderAABB;
            break;
          case 'XPlane':
            colliders['xPlane'] = colliderAABB;
            break;
          case 'Y':
            colliders['y'] = colliderAABB;
            break;
          case 'YPlane':
            colliders['yPlane'] = colliderAABB;
            break;
          case 'Z':
            colliders['z'] = colliderAABB;
            break;
          case 'ZPlane':
            colliders['zPlane'] = colliderAABB;
            break;
          default:
            console.warn(`[${MoveGizmoNode.name}] (${walkModelParts.name}) Unhandled collider mesh (name='${part.name}')`);
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
      colliders,
    };
  }

  private get input(): IInputSystem { return this.scene.engine.inputSystem; }

  public override get parent(): SceneNode { return super.parent!; }
  public override set parent(value: SceneNode) { super.parent = value; }
}
