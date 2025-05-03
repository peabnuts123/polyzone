import { Color3 } from "@polyzone/core/src";

import { toColor3Core } from '@polyzone/runtime/src/util/color';

import { AssetType, MeshAssetDefinition, MeshAssetMaterialOverrideDefinition, MeshAssetMaterialOverrideReflectionType } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";
import { ITextureAssetData } from "./TextureAssetData";

export interface MeshAssetMaterialOverrideReflectionBoxNetData {
  type: 'box-net',
  strength?: number;
  texture?: ITextureAssetData;
}
export interface MeshAssetMaterialOverrideReflection3x2Data {
  type: '3x2',
  strength?: number;
  texture?: ITextureAssetData;
}
export interface MeshAssetMaterialOverrideReflection6x1Data {
  type: '6x1',
  strength?: number;
  texture?: ITextureAssetData;
}

export interface MeshAssetMaterialOverrideReflectionSeparateData {
  type: 'separate',
  strength?: number;
  pxTexture?: ITextureAssetData;
  nxTexture?: ITextureAssetData;
  pyTexture?: ITextureAssetData;
  nyTexture?: ITextureAssetData;
  pzTexture?: ITextureAssetData;
  nzTexture?: ITextureAssetData;
}

export type MeshAssetMaterialOverrideReflectionData = MeshAssetMaterialOverrideReflectionBoxNetData | MeshAssetMaterialOverrideReflection3x2Data | MeshAssetMaterialOverrideReflection6x1Data | MeshAssetMaterialOverrideReflectionSeparateData;
export type MeshAssetMaterialOverrideReflectionDataOfType<T extends MeshAssetMaterialOverrideReflectionType> = Extract<MeshAssetMaterialOverrideReflectionData, { type: T }>;

export interface IMeshAssetMaterialOverrideData {
  get diffuseColor(): Color3 | undefined;
  get diffuseTexture(): ITextureAssetData | undefined;
  get emissionColor(): Color3 | undefined;
  get reflection(): MeshAssetMaterialOverrideReflectionData | undefined;
}

export class MeshAssetMaterialOverrideData implements IMeshAssetMaterialOverrideData {
  // private material: MaterialAssetData; // @TODO
  private _diffuseColor: Color3 | undefined;
  private _diffuseTexture: ITextureAssetData | undefined;
  private _emissionColor: Color3 | undefined;
  private _reflection: MeshAssetMaterialOverrideReflectionData | undefined;

  public static createFrom(definition: MeshAssetMaterialOverrideDefinition, assetDb: IAssetDb): MeshAssetMaterialOverrideData {
    const self = new MeshAssetMaterialOverrideData();

    if (definition.diffuseColor) {
      self.diffuseColor = toColor3Core(definition.diffuseColor);
    }
    if (definition.diffuseTextureAssetId) {
      self.diffuseTexture = assetDb.getById(definition.diffuseTextureAssetId, AssetType.Texture);
    }
    if (definition.emissionColor) {
      self.emissionColor = toColor3Core(definition.emissionColor);
    }
    if (definition.reflection) {
      switch (definition.reflection.type) {
        case "box-net":
          self.reflection = {
            type: definition.reflection.type,
            strength: definition.reflection.strength,
            texture: definition.reflection.textureAssetId ? assetDb.getById(definition.reflection.textureAssetId, AssetType.Texture) : undefined,
          };
          break;
        case "3x2":
          self.reflection = {
            type: definition.reflection.type,
            strength: definition.reflection.strength,
            texture: definition.reflection.textureAssetId ? assetDb.getById(definition.reflection.textureAssetId, AssetType.Texture) : undefined,
          };
          break;
        case "6x1":
          self.reflection = {
            type: definition.reflection.type,
            strength: definition.reflection.strength,
            texture: definition.reflection.textureAssetId ? assetDb.getById(definition.reflection.textureAssetId, AssetType.Texture) : undefined,
          };
          break;
        case "separate":
          self.reflection = {
            type: definition.reflection.type,
            strength: definition.reflection.strength,
            pxTexture: definition.reflection.pxTextureAssetId ? assetDb.getById(definition.reflection.pxTextureAssetId, AssetType.Texture) : undefined,
            nxTexture: definition.reflection.nxTextureAssetId ? assetDb.getById(definition.reflection.nxTextureAssetId, AssetType.Texture) : undefined,
            pyTexture: definition.reflection.pyTextureAssetId ? assetDb.getById(definition.reflection.pyTextureAssetId, AssetType.Texture) : undefined,
            nyTexture: definition.reflection.nyTextureAssetId ? assetDb.getById(definition.reflection.nyTextureAssetId, AssetType.Texture) : undefined,
            pzTexture: definition.reflection.pzTextureAssetId ? assetDb.getById(definition.reflection.pzTextureAssetId, AssetType.Texture) : undefined,
            nzTexture: definition.reflection.nzTextureAssetId ? assetDb.getById(definition.reflection.nzTextureAssetId, AssetType.Texture) : undefined,
          };
          break;
        default:
          throw new Error(`Unimplemented reflection type '${(definition.reflection as { 'type': string }).type}'`);
      }
    }

    return self;
  }

  public get diffuseColor(): Color3 | undefined { return this._diffuseColor; }
  public set diffuseColor(value: Color3 | undefined) { this._diffuseColor = value; }
  public get diffuseTexture(): ITextureAssetData | undefined { return this._diffuseTexture; }
  public set diffuseTexture(value: ITextureAssetData | undefined) { this._diffuseTexture = value; }
  public get emissionColor(): Color3 | undefined { return this._emissionColor; }
  public set emissionColor(value: Color3 | undefined) { this._emissionColor = value; }
  public get reflection(): MeshAssetMaterialOverrideReflectionData | undefined { return this._reflection; }
  public set reflection(value: MeshAssetMaterialOverrideReflectionData | undefined) { this._reflection = value; }
}

export interface IMeshAssetData extends IBaseAssetData<AssetType.Mesh> {
  getOverridesForMaterial(materialName: string): IMeshAssetMaterialOverrideData | undefined;
  get materialOverrides(): Record<string, IMeshAssetMaterialOverrideData>;
}

export class MeshAssetData extends BaseAssetData<AssetType.Mesh> implements IMeshAssetData {
  public readonly type: AssetType.Mesh = AssetType.Mesh;

  private _materialOverrides: Record<string, IMeshAssetMaterialOverrideData> = {};

  public loadDefinition(assetDefinition: MeshAssetDefinition, assetDb: IAssetDb): void {
    if (assetDefinition.materialOverrides !== undefined) {
      for (const materialOverrideName of Object.keys(assetDefinition.materialOverrides)) {
        const materialOverride = assetDefinition.materialOverrides[materialOverrideName];
        this.materialOverrides[materialOverrideName] = MeshAssetMaterialOverrideData.createFrom(materialOverride, assetDb);
      }
    }
  }

  public getOverridesForMaterial(materialName: string): IMeshAssetMaterialOverrideData | undefined {
    return this.materialOverrides[materialName];
  }

  public get materialOverrides(): Record<string, IMeshAssetMaterialOverrideData> {
    return this._materialOverrides;
  }
}
