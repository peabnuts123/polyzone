import { makeAutoObservable } from "mobx";
import { BoxColliderNode, Scene as LoPolyScene, ObjectNode } from '@lopoly/engine/scene';
import { Enum } from '@lopoly/engine/util/types';
import { PointerState } from "@lopoly/engine/input";

import type { ISceneViewController } from "./SceneViewController";
import { ClaimedPointerCallbacks } from "@lib/common/view";
import {
  BoundingBoxGizmoNode,
  MoveGizmoNode, MoveGizmoNodeResources,
  RotateGizmoNode, RotateGizmoNodeResources,
  ScaleGizmoNode, ScaleGizmoNodeResources,
} from "./gizmos";

export const CurrentSelectionTool = {
  Move: 'move',
  Rotate: 'rotate',
  Scale: 'scale',
} as const;
export type CurrentSelectionTool = Enum<typeof CurrentSelectionTool>;

export interface SelectionManagerResources {
  moveGizmo: MoveGizmoNodeResources;
  rotateGizmo: RotateGizmoNodeResources;
  scaleGizmo: ScaleGizmoNodeResources;
}

export class SelectionManager {
  // private readonly lopolyScene: LoPolyScene;
  private readonly sceneViewController: ISceneViewController;

  private gizmoParent: ObjectNode;
  private moveGizmo: MoveGizmoNode | undefined;
  private rotateGizmo: RotateGizmoNode | undefined;
  private scaleGizmo: ScaleGizmoNode | undefined;
  private boundingBoxGizmo: BoundingBoxGizmoNode;

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
    this.boundingBoxGizmo = new BoundingBoxGizmoNode(lopolyScene, this.gizmoParent);

    // @NOTE Load gizmos asynchronously. They have just a little bit of model loading
    // to perform. We can't do this up front because it depends on LoPoly IEngine which
    // is captured in ViewController and only instantiated AFTER SceneViewController is created.
    // We also need the inverse reference to SceneViewController.
    // So we have little choice but to do this work asynchronously in the constructor.
    const moveGizmoLoadStart = performance.now();
    void MoveGizmoNode.create(lopolyScene, sceneViewController, this.gizmoParent, resources.moveGizmo).then((moveGizmo) => {
      const moveGizmoLoadStop = performance.now();
      console.log(`Loaded ${MoveGizmoNode.name} in ${moveGizmoLoadStop - moveGizmoLoadStart}ms`);
      this.moveGizmo = moveGizmo;
    });
    const rotateGizmoLoadStart = performance.now();
    void RotateGizmoNode.create(lopolyScene, sceneViewController, this.gizmoParent, resources.rotateGizmo).then((rotateGizmo) => {
      const rotateGizmoLoadStop = performance.now();
      console.log(`Loaded ${RotateGizmoNode.name} in ${rotateGizmoLoadStop - rotateGizmoLoadStart}ms`);
      this.rotateGizmo = rotateGizmo;
    });
    const scaleGizmoLoadStart = performance.now();
    void ScaleGizmoNode.create(lopolyScene, sceneViewController, this.gizmoParent, resources.scaleGizmo).then((scaleGizmo) => {
      const scaleGizmoLoadStop = performance.now();
      console.log(`Loaded ${ScaleGizmoNode.name} in ${scaleGizmoLoadStop - scaleGizmoLoadStart}ms`);
      this.scaleGizmo = scaleGizmo;
    });

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
      rotateGizmo: await RotateGizmoNode.loadResources(),
      scaleGizmo: await ScaleGizmoNode.loadResources(),
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
      this.moveGizmo === undefined ||
      this.rotateGizmo === undefined ||
      this.scaleGizmo === undefined
    ) return;

    // Clear all gizmos
    this.moveGizmo.detach();
    this.rotateGizmo.detach();
    this.scaleGizmo.detach();
    this.boundingBoxGizmo.detach();
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
      this.boundingBoxGizmo.attachToGameObject(selectedObjectInstance);
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

  public get currentGizmo(): MoveGizmoNode | RotateGizmoNode | ScaleGizmoNode | undefined {
    if (this.selectedObjectId !== undefined) {
      switch (this.currentTool) {
        case CurrentSelectionTool.Move:
          return this.moveGizmo;
        case CurrentSelectionTool.Rotate:
          return this.rotateGizmo;
        case CurrentSelectionTool.Scale:
          return this.scaleGizmo;
        default:
          console.error(`[${SelectionManager.name}] (currentGizmo) Unimplemented tool type: ${this.currentTool}`);
      }
    }
  }

  public get selectedObjectBoundingBox(): BoxColliderNode | undefined {
    if (this.boundingBoxGizmo.enabled) {
      return this.boundingBoxGizmo.box;
    }
  }
}
