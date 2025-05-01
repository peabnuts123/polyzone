import type { CameraComponent } from '@polyzone/runtime/src/world/components'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { IComponentData } from './ComponentData';

export interface ICameraComponentData extends IComponentData {
}

/**
 * Configuration data for a {@link CameraComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class CameraComponentData implements ICameraComponentData {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
  }
}
