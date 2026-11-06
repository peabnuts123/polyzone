import { Color4 } from "@polyzone/core/math/Color4";

export const GizmoConfig = {
  /**
   * Collider group for all gizmo handle colliders.
   * Every collider must have a group (for collision calculations). Even though
   * we don't expect there to ever be any collision calculations within the editor,
   * we pick a group that's out of the way.
   */
  GizmoColliderGroup: 1,
  /** Color that the gizmo handles will be when highlighted by the mouse. */
  HandleHighlightColor: Color4.yellow(),
  /** Color that the gizmo handles will be when actively being used. */
  HandleActiveColor: Color4.yellow(),
  /**
   * Distance at which gizmo models are at 100% scale.
   * Smaller numbers = bigger on-screen size.
   * Larger numbers = smaller on-screen size.
   */
  FullSizeDistance: 18,
};
