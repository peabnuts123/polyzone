import type { MeshComponent } from '@polyzone/runtime/src/world/components'; // eslint-disable-line @typescript-eslint/no-unused-vars

import type { IMeshAssetData } from '../assets';
import { IComponentData } from './ComponentData';

export interface IMeshComponentData extends IComponentData {
  get meshAsset(): IMeshAssetData | undefined;
}

/**
 * Configuration data for a {@link MeshComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class MeshComponentData implements IMeshComponentData {
  public readonly id: string;
  /** {@link IMeshAssetData} containing the mesh asset. */
  public meshAsset: IMeshAssetData | undefined;

  public constructor(id: string, meshAsset?: IMeshAssetData) {
    this.id = id;
    this.meshAsset = meshAsset;
  }
}
