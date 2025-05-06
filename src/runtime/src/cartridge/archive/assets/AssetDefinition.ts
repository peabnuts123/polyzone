import { AssetType } from './AssetType';
import { MeshAssetDefinition } from './MeshAssetDefinition';
import { MeshSupplementaryAssetDefinition } from './MeshSupplementaryAssetDefinition';
import { ScriptAssetDefinition } from './ScriptAssetDefinition';
import { SoundAssetDefinition } from './SoundAssetDefinition';
import { TextureAssetDefinition } from './TextureAssetDefinition';
import { MaterialAssetDefinition } from './MaterialAssetDefinition';

/**
 * Raw reference to an asset.
 * i.e. A pointer to a file, before being loaded by the engine.
 */
export interface BaseAssetDefinition {
    id: string;
    path: string;
}

export type AssetDefinition = MeshAssetDefinition | MeshSupplementaryAssetDefinition | ScriptAssetDefinition | SoundAssetDefinition | TextureAssetDefinition | MaterialAssetDefinition;
export type AssetDefinitionOfType<TAssetType extends AssetType> = Extract<AssetDefinition, { type: TAssetType }>;
