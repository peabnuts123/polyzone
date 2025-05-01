import { AssetType, ISoundAssetData, SoundAssetData as SoundAssetDataRuntime } from "@polyzone/runtime/src/cartridge";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";

export class SoundAssetData extends BaseAssetData<AssetType.Sound> implements ISoundAssetData {
  private _soundAssetData: SoundAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const soundAssetData = new SoundAssetDataRuntime(args);
    super(args, soundAssetData);
    this._soundAssetData = soundAssetData;
  }
}
