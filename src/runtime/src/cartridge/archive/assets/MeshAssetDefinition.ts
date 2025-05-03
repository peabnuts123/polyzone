import { ColorDefinition } from "../util";
import { BaseAssetDefinition } from "./AssetDefinition";
import { AssetType } from "./AssetType";

export interface MeshAssetMaterialOverrideReflectionBoxNetDefinition {
  type: 'box-net',
  strength?: number;
  textureAssetId?: string;
}
export interface MeshAssetMaterialOverrideReflection3x2Definition {
  type: '3x2',
  strength?: number;
  textureAssetId?: string;
}
export interface MeshAssetMaterialOverrideReflection6x1Definition {
  type: '6x1',
  strength?: number;
  textureAssetId?: string;
}
export interface MeshAssetMaterialOverrideReflectionSeparateDefinition {
  type: 'separate',
  strength?: number;
  pxTextureAssetId?: string;
  nxTextureAssetId?: string;
  pyTextureAssetId?: string;
  nyTextureAssetId?: string;
  pzTextureAssetId?: string;
  nzTextureAssetId?: string;
}

export type MeshAssetMaterialOverrideReflectionType = MeshAssetMaterialOverrideReflectionDefinition['type'];
export type MeshAssetMaterialOverrideReflectionDefinition = MeshAssetMaterialOverrideReflectionBoxNetDefinition | MeshAssetMaterialOverrideReflection3x2Definition | MeshAssetMaterialOverrideReflection6x1Definition | MeshAssetMaterialOverrideReflectionSeparateDefinition;
export type MeshAssetMaterialOverrideReflectionDefinitionOfType<T extends MeshAssetMaterialOverrideReflectionType> = Extract<MeshAssetMaterialOverrideReflectionDefinition, { type: T }>;

export interface MeshAssetMaterialOverrideDefinition {
  // materialAssetId?: string;
  diffuseColor?: ColorDefinition;
  diffuseTextureAssetId?: string;
  emissionColor?: ColorDefinition;
  reflection?: MeshAssetMaterialOverrideReflectionDefinition;
}

export interface MeshAssetDefinition extends BaseAssetDefinition {
  type: AssetType.Mesh;
  materialOverrides?: Record<string, MeshAssetMaterialOverrideDefinition>;
}
