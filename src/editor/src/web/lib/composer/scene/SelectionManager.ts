import { makeAutoObservable } from "mobx";
import { GizmoManager } from "@babylonjs/core/Gizmos/gizmoManager";
import { PositionGizmo } from "@babylonjs/core/Gizmos/positionGizmo";
import { BoundingBoxGizmo } from "@babylonjs/core/Gizmos/boundingBoxGizmo";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { RotationGizmo } from "@babylonjs/core/Gizmos/rotationGizmo";
import { ScaleGizmo } from "@babylonjs/core/Gizmos/scaleGizmo";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Quaternion as QuaternionBabylon, Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";

import { toVector3Core } from "@polyzone/runtime/src/util";
import { Vector3 as Vector3Core } from "@polyzone/core/src";
import { toQuaternionCore } from "@polyzone/runtime/src/util/quaternion";

import { SetGameObjectPositionMutation, SetGameObjectRotationMutation, SetGameObjectScaleMutation } from "@lib/mutation/SceneView/mutations";
import { SceneViewController } from "./SceneViewController";


export enum CurrentSelectionTool {
  Move = 'move',
  Rotate = 'rotate',
  Scale = 'scale',
}

export class SelectionManager {
  private readonly babylonScene: BabylonScene;
  private readonly sceneViewController: SceneViewController;
  private readonly gizmoManager: GizmoManager;
  private readonly moveGizmo: PositionGizmo;
  private readonly rotateGizmo: RotationGizmo;
  private readonly scaleGizmo: ScaleGizmo;
  private readonly boundingBoxGizmo: BoundingBoxGizmo;

  private _currentTool: CurrentSelectionTool = CurrentSelectionTool.Rotate;
  private _selectedObjectId: string | undefined = undefined;
  private fakeTransformTarget: TransformNode | undefined = undefined;

  private currentMoveMutation: SetGameObjectPositionMutation | undefined = undefined;
  private currentRotateMutation: SetGameObjectRotationMutation | undefined = undefined;
  private currentScaleMutation: SetGameObjectScaleMutation | undefined = undefined;

  public constructor(scene: BabylonScene, sceneViewController: SceneViewController) {
    this.babylonScene = scene;
    this.sceneViewController = sceneViewController;
    const utilityLayer = new UtilityLayerRenderer(scene);
    this.gizmoManager = new GizmoManager(scene, 2, utilityLayer);
    this.gizmoManager.usePointerToAttachGizmos = false;

    // Move
    this.moveGizmo = new PositionGizmo(utilityLayer, 2, this.gizmoManager);
    this.moveGizmo.planarGizmoEnabled = true;
    this.moveGizmo.onDragStartObservable.add(() => {
      this.currentMoveMutation = new SetGameObjectPositionMutation(this.selectedObjectId!);
      sceneViewController.mutator.beginContinuous(this.currentMoveMutation);
    });
    this.moveGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObjectId !== undefined) {
        const selectedObjectInstance = this.sceneViewController.findGameObjectById(this.selectedObjectId);
        if (selectedObjectInstance === undefined) throw new Error(`Cannot update position, no game object exists in the scene with id '${this.selectedObjectId}'`);

        const newPosition = selectedObjectInstance.transform.localPosition.clone();

        // Invert parent scale so that objects move exactly with the gizmo
        let parentScale = Vector3Core.one();
        if (selectedObjectInstance.transform.parent !== undefined) {
          parentScale = selectedObjectInstance.transform.parent.localScale; // @TODO Absolute scale?
        }

        if (parentScale.x <= Number.EPSILON) console.warn(`[${SelectionManager.name}] (moveGizmo.onDragObservable) Moving object whose parentScale.x is 0. x coordinate can not be extrapolated and will remain unmodified`);
        else newPosition.x = this.fakeTransformTarget!.position.x / parentScale.x;
        if (parentScale.y <= Number.EPSILON) console.warn(`[${SelectionManager.name}] (moveGizmo.onDragObservable) Moving object whose parentScale.y is 0. y coordinate can not be extrapolated and will remain unmodified`);
        else newPosition.y = this.fakeTransformTarget!.position.y / parentScale.y;
        if (parentScale.z <= Number.EPSILON) console.warn(`[${SelectionManager.name}] (moveGizmo.onDragObservable) Moving object whose parentScale.z is 0. z coordinate can not be extrapolated and will remain unmodified`);
        else newPosition.z = this.fakeTransformTarget!.position.z / parentScale.z;

        sceneViewController.mutator.updateContinuous(this.currentMoveMutation!, {
          position: newPosition,
        });
      }
    });
    this.moveGizmo.onDragEndObservable.add(() => {
      sceneViewController.mutator.apply(this.currentMoveMutation!);
      this.currentMoveMutation = undefined;
    });

    // Rotate
    this.rotateGizmo = new RotationGizmo(utilityLayer, 32, true, 6, this.gizmoManager);
    this.rotateGizmo.onDragStartObservable.add(() => {
      this.currentRotateMutation = new SetGameObjectRotationMutation(this.selectedObjectId!);
      sceneViewController.mutator.beginContinuous(this.currentRotateMutation);
    });
    this.rotateGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObjectId !== undefined) {
        // Sometimes the rotation comes down as a quaternion, and sometimes not.
        // At this stage, I don't really know why ¯\_(ツ)_/¯
        const rotation = this.fakeTransformTarget!.rotationQuaternion!;
        if (this.fakeTransformTarget!.rotationQuaternion === null) {
          throw new Error(`Rotation quaternion is undefined somehow`);
        }

        sceneViewController.mutator.updateContinuous(this.currentRotateMutation!, {
          rotation: toQuaternionCore(rotation),
        });
      }
    });
    this.rotateGizmo.onDragEndObservable.add((_eventData) => {
      sceneViewController.mutator.apply(this.currentRotateMutation!);
      this.currentRotateMutation = undefined;
    });

    // Scale
    this.scaleGizmo = new ScaleGizmo(utilityLayer, 2, this.gizmoManager);
    this.scaleGizmo.onDragStartObservable.add(() => {
      this.currentScaleMutation = new SetGameObjectScaleMutation(this.selectedObjectId!);
      sceneViewController.mutator.beginContinuous(this.currentScaleMutation);
    });
    this.scaleGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObjectId !== undefined) {
        // Scaling is handled as a percentage to accommodate rotation
        sceneViewController.mutator.updateContinuous(this.currentScaleMutation!, {
          scaleDelta: toVector3Core(this.fakeTransformTarget!.scaling),
        });
        // @NOTE Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
        this.fakeTransformTarget!.scaling = Vector3Babylon.One();
      }
    });
    this.scaleGizmo.onDragEndObservable.add(() => {
      sceneViewController.mutator.apply(this.currentScaleMutation!);
      this.currentScaleMutation = undefined;
    });

    // Bounding box
    this.boundingBoxGizmo = new BoundingBoxGizmo(Color3.Yellow(), utilityLayer);
    this.boundingBoxGizmo.setEnabledScaling(false);
    this.boundingBoxGizmo.setEnabledRotationAxis("");

    this.updateGizmos();

    makeAutoObservable(this);
  }

  public select(gameObjectId: string): void {
    this.selectedObjectId = gameObjectId;
  }

  public deselectAll(): void {
    this.selectedObjectId = undefined;
  }

  public updateGizmos(): void {
    // Clear all gizmos
    this.moveGizmo.attachedNode = null;
    this.rotateGizmo.attachedNode = null;
    this.scaleGizmo.attachedNode = null;
    this.boundingBoxGizmo.attachedMesh = null;

    if (this.selectedObjectId !== undefined) {
      const selectedObjectInstance = this.sceneViewController.findGameObjectById(this.selectedObjectId);
      if (selectedObjectInstance === undefined) throw new Error(`Cannot update gizmos, no game object exists in the scene with id '${this.selectedObjectId}'`);
      const realTransformTarget = selectedObjectInstance.transform.node;

      // Construct a new dummy transform target if we need one and it doesn't exist
      if (this.fakeTransformTarget === undefined) {
        this.fakeTransformTarget = new TransformNode("SelectionManager_fakeTransformTarget", this.babylonScene);
        this.fakeTransformTarget.rotationQuaternion = QuaternionBabylon.Identity();
      }

      // Ensure fake transform target's local coordinates match the local coordinates of the
      // real transform target by giving it a dummy parent transform
      let parentScale = Vector3Babylon.One();
      if (realTransformTarget.parent !== null) {
        const realParent = realTransformTarget.parent as TransformNode;
        parentScale = realParent.absoluteScaling;
        if (this.fakeTransformTarget.parent === null) {
          // Creating a new fake transform parent
          const fakeParent = new TransformNode(`SelectionManager_fakeTransformParent`, this.babylonScene);
          fakeParent.position = realParent.absolutePosition.clone();
          fakeParent.rotationQuaternion = realParent.absoluteRotationQuaternion.clone();
          this.fakeTransformTarget.parent = fakeParent;
        } else {
          // Re-using an existing fake transform parent
          const fakeParent = this.fakeTransformTarget.parent as TransformNode;
          fakeParent.position = realParent.absolutePosition.clone();
          fakeParent.rotationQuaternion = realParent.absoluteRotationQuaternion.clone();
        }
      } else {
        // No fake transform parent
        this.fakeTransformTarget.parent = null;
      }

      // Position dummy transform target on the selection target
      this.fakeTransformTarget.position = realTransformTarget.position.multiply(parentScale);
      this.fakeTransformTarget.rotationQuaternion = (realTransformTarget.rotationQuaternion ?? realTransformTarget.rotation.toQuaternion()).clone();
      // Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
      // Scaling is done as a percentage to accommodate this
      this.fakeTransformTarget.scaling = Vector3Babylon.One();

      // Enable bounding box
      // @NOTE Type laundering (huff my duff, Babylon))
      this.boundingBoxGizmo.attachedMesh = realTransformTarget as AbstractMesh;

      // Enable only the current tool
      switch (this.currentTool) {
        case CurrentSelectionTool.Move:
          this.moveGizmo.attachedNode = this.fakeTransformTarget;
          break;
        case CurrentSelectionTool.Rotate:
          this.rotateGizmo.attachedNode = this.fakeTransformTarget;
          break;
        case CurrentSelectionTool.Scale:
          this.scaleGizmo.attachedNode = this.fakeTransformTarget;
          break;
        default:
          console.error(`[SelectionManager] (updateGizmos) Unimplemented tool type: ${this.currentTool}`);
      }
    } else {
      // Destroy dummy transform target if we've deselected
      this.fakeTransformTarget?.parent?.dispose();
      this.fakeTransformTarget?.dispose();
      this.fakeTransformTarget = undefined;
    }
  }

  public destroy(): void {
    this.moveGizmo.dispose();
    this.rotateGizmo.dispose();
    this.scaleGizmo.dispose();
    this.boundingBoxGizmo.dispose();
    this.gizmoManager.dispose();
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
}
