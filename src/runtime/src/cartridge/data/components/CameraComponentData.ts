import type { CameraComponent } from '@polyzone/runtime/objects/components'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { IComponentData } from './ComponentData';

export interface ICameraComponentData extends IComponentData {
}

/**
 * Configuration data for a {@link CameraComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class CameraComponentData implements ICameraComponentData {
  public readonly id: string;
  // @TODO fov and such

  public constructor(id: string) {
    this.id = id;
  }
}
