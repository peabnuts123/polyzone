import { AssetType } from "@polyzone/runtime/cartridge";

import { MaterialAssetData, MeshAssetData, MeshSupplementaryAssetData, ScriptAssetData, SoundAssetData, TextureAssetData } from './assets';

export type AssetData = MeshAssetData | MeshSupplementaryAssetData | ScriptAssetData | SoundAssetData | TextureAssetData | MaterialAssetData;
export type AssetDataOfType<TAssetType extends AssetType> = Extract<AssetData, { type: TAssetType }>;
