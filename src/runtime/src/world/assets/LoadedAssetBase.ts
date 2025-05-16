import { AssetType } from '@polyzone/runtime/src/cartridge';

export abstract class LoadedAssetBase<TAssetType extends AssetType> {
  public readonly id: string;
  public abstract get type(): TAssetType;
  public dispose(): void { }

  public constructor(id: string) {
    this.id = id;
  }
}
