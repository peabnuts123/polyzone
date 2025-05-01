import type { Color3 } from '@polyzone/core/src/util';
import type { DirectionalLightComponent } from '@polyzone/runtime/src/world/components'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { IComponentData } from './ComponentData';

export interface IDirectionalLightComponentData extends IComponentData {
  get intensity(): number;
  get color(): Color3;
}

/**
 * Configuration data for a {@link DirectionalLightComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class DirectionalLightComponentData implements IDirectionalLightComponentData {
  public readonly id: string;
  public intensity: number;
  public color: Color3;

  public constructor(id: string, intensity: number, color: Color3) {
    this.id = id;
    this.intensity = intensity;
    this.color = color;
  }
}
