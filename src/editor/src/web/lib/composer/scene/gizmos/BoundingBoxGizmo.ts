import { Matrix4 } from "@lopoly/engine/math";
import { BoxColliderNode, IScene, SceneNode } from "@lopoly/engine/scene";

import { Quaternion, Vector3 } from "@polyzone/core/math";

import { EditorMeshComponent, EditorObject, IEditorObjectComponent } from "@lib/common/objects";
import { GizmoConfig } from "./config";

/** Draws bounds for an EditorObject and its descendants, aligned with the gizmo's axes. */
export class BoundingBoxGizmoNode extends SceneNode {
  private readonly _box: BoxColliderNode;
  private attachedEditorObject: EditorObject | undefined;

  public constructor(scene: IScene, parent?: SceneNode) {
    super(scene, `gizmo:bounding-box`, parent);
    this._box = new BoxColliderNode(scene, `${this.name}:box`, GizmoConfig.GizmoColliderGroup, Vector3.zero(), this);
    this._box.drawWireframe = true;
  }

  public override onUpdate(_dt: number, _time: number): void {
    // @NOTE Check for `attachedEditorObject` proactively so that we don't clear bounds every frame
    if (this.attachedEditorObject !== undefined) {
      this.updateBounds();
    }
  }

  private tmp_updateBounds_minPoint = Vector3.zero();
  private tmp_updateBounds_maxPoint = Vector3.zero();
  private tmp_updateBounds_worldToLocal = new Matrix4();
  private updateBounds(): void {
    if (this.attachedEditorObject !== undefined) {
      // Ensure rotation always matches the attached object
      this.absoluteRotation.q = this.attachedEditorObject.absoluteRotation.q;

      // Reset bounds
      this.tmp_updateBounds_minPoint.setValue(Infinity, Infinity, Infinity);
      this.tmp_updateBounds_maxPoint.setValue(-Infinity, -Infinity, -Infinity);
      this.tmp_updateBounds_worldToLocal.setValue(this.worldMatrix).invertSelf();

      // Update bounds with min / max points from each child model node
      this.updateTmpRangesForEachComponent(this.attachedEditorObject.components);
      this.attachedEditorObject.forEachChild((childObject) => {
        this.updateTmpRangesForEachComponent(childObject.components);
      }, true);

      // Update bounding box from bounds
      this.box.x = this.tmp_updateBounds_maxPoint.x - this.tmp_updateBounds_minPoint.x;
      this.box.y = this.tmp_updateBounds_maxPoint.y - this.tmp_updateBounds_minPoint.y;
      this.box.z = this.tmp_updateBounds_maxPoint.z - this.tmp_updateBounds_minPoint.z;
      this.box.position.x = (this.tmp_updateBounds_maxPoint.x + this.tmp_updateBounds_minPoint.x) / 2;
      this.box.position.y = (this.tmp_updateBounds_maxPoint.y + this.tmp_updateBounds_minPoint.y) / 2;
      this.box.position.z = (this.tmp_updateBounds_maxPoint.z + this.tmp_updateBounds_minPoint.z) / 2;
    } else {
      // Clear rotation
      this.absoluteRotation.q = Quaternion.identity();

      // Clear bounding box (even though it won't be rendered)
      this.box.x = this.box.y = this.box.z = 0;
      this.box.position.x = this.box.position.y = this.box.position.z = 0;
    }
  }

  private tmp_updateTmpRangesForEachComponent_vertex = Vector3.zero();
  private updateTmpRangesForEachComponent(components: readonly IEditorObjectComponent[]): void {
    for (const component of components) {
      if (component instanceof EditorMeshComponent && component.modelNode !== undefined) {
        for (const worldVertex of component.modelNode.geometry.allVertexPositions) {
          // @NOTE Need to convert vertex position in local space to be able to calculate max / min
          const vertex = this.tmp_updateBounds_worldToLocal.transformPointInPlace(
            this.tmp_updateTmpRangesForEachComponent_vertex.setValue(worldVertex),
          );

          // Min point
          if (vertex.x < this.tmp_updateBounds_minPoint.x) this.tmp_updateBounds_minPoint.x = vertex.x;
          if (vertex.y < this.tmp_updateBounds_minPoint.y) this.tmp_updateBounds_minPoint.y = vertex.y;
          if (vertex.z < this.tmp_updateBounds_minPoint.z) this.tmp_updateBounds_minPoint.z = vertex.z;
          // Max point
          if (vertex.x > this.tmp_updateBounds_maxPoint.x) this.tmp_updateBounds_maxPoint.x = vertex.x;
          if (vertex.y > this.tmp_updateBounds_maxPoint.y) this.tmp_updateBounds_maxPoint.y = vertex.y;
          if (vertex.z > this.tmp_updateBounds_maxPoint.z) this.tmp_updateBounds_maxPoint.z = vertex.z;
        }
      }
    }
  }

  /**
   * Attach this gizmo to a {@link EditorObject}.
   */
  public attachToEditorObject(object: EditorObject): void {
    this.attachedEditorObject = object;
    this.updateBounds();
    this.enabled = true;
  }

  /**
   * Detach this gizmo from the current {@link EditorObject}.
   */
  public detach(): void {
    this.attachedEditorObject = undefined;
    this.enabled = false;
    this.updateBounds();
  }

  public get box(): BoxColliderNode { return this._box; }
}
