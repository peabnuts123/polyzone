import { AxisAlignedBoundingBox } from '@lopoly/engine/collision';
import { BoxColliderNode, IScene, SceneNode } from '@lopoly/engine/scene';
import { GizmoConfig } from './config';

/**
 * Convert an {@link AxisAlignedBoundingBox} to a {@link BoxColliderNode},
 * for use by a Gizmo.
 * @param aabb Axis-aligned bounding box
 * @param type Gizmo handle type (e.g. 'x')
 * @param scene LoPoly scene instance to instantiate the collider in
 * @param gizmoNode GizmoNode instance
 * @returns
 */
export function mapAabbToCollider<TGizmoHandleType extends string>(aabb: AxisAlignedBoundingBox | undefined, type: TGizmoHandleType, scene: IScene, gizmoNode: SceneNode): BoxColliderNode | undefined {
  if (aabb) {
    const collider = new BoxColliderNode(
      scene,
      `${gizmoNode.name}:collider_${type}`,
      GizmoConfig.GizmoColliderGroup,
      {
        x: aabb.xMax - aabb.xMin,
        y: aabb.yMax - aabb.yMin,
        z: aabb.zMax - aabb.zMin,
      },
      gizmoNode,
    );
    collider.position.x = (aabb.xMin + aabb.xMax) / 2;
    collider.position.y = (aabb.yMin + aabb.yMax) / 2;
    collider.position.z = (aabb.zMin + aabb.zMax) / 2;
    return collider;
  }
}
