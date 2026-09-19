import { Color3Definition } from "../util";
import { BaseAssetDefinition } from "./AssetDefinition";
import { AssetType } from "./AssetType";

export interface MeshAssetMaterialOverrideReflectionBoxNetDefinition {
  type: 'box-net',
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
export type MeshAssetMaterialOverrideReflectionDefinition = MeshAssetMaterialOverrideReflectionBoxNetDefinition | MeshAssetMaterialOverrideReflectionSeparateDefinition;
export type MeshAssetMaterialOverrideReflectionDefinitionOfType<T extends MeshAssetMaterialOverrideReflectionType> = Extract<MeshAssetMaterialOverrideReflectionDefinition, { type: T }>;

export interface MeshAssetMaterialOverrideDefinition {
  materialAssetId?: string;
  diffuseColor?: Color3Definition;
  diffuseTextureAssetId?: string;
  reflection?: MeshAssetMaterialOverrideReflectionDefinition;
  lightingEnabled?: boolean;
}

export interface MeshAssetDefinition extends BaseAssetDefinition {
  type: AssetType.Mesh;
  materialOverrides?: Record<string, MeshAssetMaterialOverrideDefinition>;
}
