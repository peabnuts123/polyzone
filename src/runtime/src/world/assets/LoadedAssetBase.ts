import { AssetType } from '@polyzone/runtime/src/cartridge';

export abstract class LoadedAssetBase<TAssetType extends AssetType> {
  public abstract get type(): TAssetType;
  public dispose(): void { }
}
