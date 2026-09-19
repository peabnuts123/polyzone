import { AssetType } from '@polyzone/runtime/cartridge/archive';

export abstract class LoadedAssetBase<TAssetType extends AssetType> {
  public readonly id: string;
  public abstract get type(): TAssetType;
  public dispose(): void { } // @TODO needed?

  public constructor(id: string) {
    this.id = id;
  }
}
