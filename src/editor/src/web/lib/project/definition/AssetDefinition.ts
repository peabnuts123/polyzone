import { AssetType, BaseAssetDefinition as RuntimeBaseAssetDefinition } from '@polyzone/runtime/src/cartridge/archive';
import {
  MeshAssetDefinition as RuntimeMeshAssetDefinition,
  MeshSupplementaryAssetDefinition as RuntimeMeshSupplementaryAssetDefinition,
  ScriptAssetDefinition as RuntimeScriptAssetDefinition,
  SoundAssetDefinition as RuntimeSoundAssetDefinition,
  TextureAssetDefinition as RuntimeTextureAssetDefinition,
  MaterialAssetDefinition as RuntimeMaterialAssetDefinition,
} from '@polyzone/runtime/src/cartridge/archive';

export interface BaseAssetDefinition extends RuntimeBaseAssetDefinition {
  hash: string;
}

export type AssetDefinition = MeshAssetDefinition | MeshSupplementaryAssetDefinition | ScriptAssetDefinition | SoundAssetDefinition | TextureAssetDefinition | MaterialAssetDefinition;
export type AssetDefinitionOfType<TAssetType extends AssetType> = Extract<AssetDefinition, { type: TAssetType }>;

export interface MeshAssetDefinition extends BaseAssetDefinition, RuntimeMeshAssetDefinition { }
export interface MeshSupplementaryAssetDefinition extends BaseAssetDefinition, RuntimeMeshSupplementaryAssetDefinition { }
export interface ScriptAssetDefinition extends BaseAssetDefinition, RuntimeScriptAssetDefinition { }
export interface SoundAssetDefinition extends BaseAssetDefinition, RuntimeSoundAssetDefinition { }
export interface TextureAssetDefinition extends BaseAssetDefinition, RuntimeTextureAssetDefinition { }
export interface MaterialAssetDefinition extends BaseAssetDefinition, RuntimeMaterialAssetDefinition { }
