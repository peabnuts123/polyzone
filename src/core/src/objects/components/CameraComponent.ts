import type { Vector3 } from '@polyzone/core/math/Vector3';
import { GameObjectComponent } from '../GameObjectComponent';
import type { GameObject as GameObject } from '../GameObject'; // eslint-disable-line @typescript-eslint/no-unused-vars

export abstract class CameraComponent extends GameObjectComponent {
  /**
   * Point the {@link _GameObject} this camera component is attached to towards a position in world space.
   * @param target Position to face (expressed in world coordinates).
   */
  abstract pointAt(target: Vector3): void;
}
