import { AssetType } from "@polyzone/runtime/src/cartridge";

import { MeshAssetData, MeshSupplementaryAssetData, ScriptAssetData, SoundAssetData, TextureAssetData } from './assets';

export type AssetData = MeshAssetData | MeshSupplementaryAssetData | ScriptAssetData | SoundAssetData | TextureAssetData;
export type AssetDataOfType<TAssetType extends AssetType> = Extract<AssetData, { type: TAssetType }>;
