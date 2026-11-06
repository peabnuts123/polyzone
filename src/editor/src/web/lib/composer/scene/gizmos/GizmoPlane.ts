import { Vector3 } from "@polyzone/core/math";
import { Enum } from "@polyzone/core/util/types";

/**
 * Plane relative to a gizmo.
 */
export const GizmoPlane = {
  XY: 'XY',
  XZ: 'XZ',
  YZ: 'YZ',
} as const;
/**
 * Plane relative to a gizmo.
 */
export type GizmoPlane = Enum<typeof GizmoPlane>;

/**
 * Dictionary of normal vectors for gizmo planes.
 */
export const GizmoPlaneNormal = {
  [GizmoPlane.XY]: Vector3.up(),
  [GizmoPlane.XZ]: Vector3.forward(),
  [GizmoPlane.YZ]: Vector3.right(),
};
