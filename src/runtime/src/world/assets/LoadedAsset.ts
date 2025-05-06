import { AssetType } from '@polyzone/runtime/src/cartridge/archive';

import { MeshAsset } from './MeshAsset';
import { MeshSupplementaryAsset } from './MeshSupplementaryAsset';
import { ScriptAsset } from './ScriptAsset';
import { SoundAsset } from './SoundAsset';
import { TextureAsset } from './TextureAsset';
import { MaterialAsset } from './MaterialAsset';

export type LoadedAsset = MeshAsset | MeshSupplementaryAsset | ScriptAsset | SoundAsset | TextureAsset | MaterialAsset;
export type LoadedAssetOfType<TAssetType extends AssetType> = Extract<LoadedAsset, { type: TAssetType }>;
