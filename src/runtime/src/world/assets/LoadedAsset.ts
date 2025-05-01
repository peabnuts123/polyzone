import { AssetType } from '@polyzone/runtime/src/cartridge/archive';

import { MeshAsset } from './MeshAsset';
import { MeshSupplementaryAsset } from './MeshSupplementaryAsset';
import { ScriptAsset } from './ScriptAsset';
import { SoundAsset } from './SoundAsset';
import { TextureAsset } from './TextureAsset';

export type LoadedAsset = MeshAsset | MeshSupplementaryAsset | ScriptAsset | SoundAsset | TextureAsset;
export type LoadedAssetOfType<TAssetType extends AssetType> = Extract<LoadedAsset, { type: TAssetType }>;
