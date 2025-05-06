import { Color3 } from "@polyzone/core/src";

import { toColor3Core } from '@polyzone/runtime/src/util/color';

import { AssetType, MeshAssetDefinition, MeshAssetMaterialOverrideDefinition, MeshAssetMaterialOverrideReflection3x2Definition, MeshAssetMaterialOverrideReflection6x1Definition, MeshAssetMaterialOverrideReflectionBoxNetDefinition, MeshAssetMaterialOverrideReflectionDefinitionOfType, MeshAssetMaterialOverrideReflectionSeparateDefinition, MeshAssetMaterialOverrideReflectionType } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";
import { ITextureAssetData } from "./TextureAssetData";
import { IMaterialAssetData } from "./MaterialAssetData";

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
  get material(): IMaterialAssetData | undefined;
  get diffuseColor(): Color3 | undefined;
  get diffuseTexture(): ITextureAssetData | undefined;
  get emissionColor(): Color3 | undefined;
  get reflection(): MeshAssetMaterialOverrideReflectionData | undefined;
}

export class MeshAssetMaterialOverrideData implements IMeshAssetMaterialOverrideData {
  private _material: IMaterialAssetData | undefined;
  private _diffuseColor: Color3 | undefined;
  private _diffuseTexture: ITextureAssetData | undefined;
  private _emissionColor: Color3 | undefined;
  private _reflection: MeshAssetMaterialOverrideReflectionData | undefined;

  public static createFrom(definition: MeshAssetMaterialOverrideDefinition, assetDb: IAssetDb): MeshAssetMaterialOverrideData {
    const self = new MeshAssetMaterialOverrideData();

    if (definition.materialAssetId) {
      self.material = assetDb.getById(definition.materialAssetId, AssetType.Material);
    }
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
      self.reflection = loadReflectionDefinition(definition.reflection, assetDb);
    }

    return self;
  }

  public get material(): IMaterialAssetData | undefined { return this._material; }
  public set material(value: IMaterialAssetData | undefined) { this._material = value; }
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

export function loadReflectionDefinition<TReflectionType extends MeshAssetMaterialOverrideReflectionType>(reflection: MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>, assetDb: IAssetDb): MeshAssetMaterialOverrideReflectionDataOfType<TReflectionType> {
  // @TODO Why does typescript need us to launder everything here?
  switch (reflection.type) {
    case "box-net": {
      const reflectionBoxNet = reflection as MeshAssetMaterialOverrideReflectionBoxNetDefinition;
      return {
        type: reflectionBoxNet.type,
        strength: reflectionBoxNet.strength,
        texture: reflectionBoxNet.textureAssetId ? assetDb.getById(reflectionBoxNet.textureAssetId, AssetType.Texture) : undefined,
      } as MeshAssetMaterialOverrideReflectionBoxNetData as MeshAssetMaterialOverrideReflectionDataOfType<TReflectionType>;
    }
    case "3x2": {
      const reflection3x2 = reflection as MeshAssetMaterialOverrideReflection3x2Definition;
      return {
        type: reflection3x2.type,
        strength: reflection3x2.strength,
        texture: reflection3x2.textureAssetId ? assetDb.getById(reflection3x2.textureAssetId, AssetType.Texture) : undefined,
      } as MeshAssetMaterialOverrideReflection3x2Data as MeshAssetMaterialOverrideReflectionDataOfType<TReflectionType>;
    }
    case "6x1": {
      const reflection6x1 = reflection as MeshAssetMaterialOverrideReflection6x1Definition;
      return {
        type: reflection6x1.type,
        strength: reflection6x1.strength,
        texture: reflection6x1.textureAssetId ? assetDb.getById(reflection6x1.textureAssetId, AssetType.Texture) : undefined,
      } as MeshAssetMaterialOverrideReflection6x1Data as MeshAssetMaterialOverrideReflectionDataOfType<TReflectionType>;
    }
    case "separate": {
      const reflectionSeparate = reflection as MeshAssetMaterialOverrideReflectionSeparateDefinition;
      return {
        type: reflectionSeparate.type,
        strength: reflectionSeparate.strength,
        pxTexture: reflectionSeparate.pxTextureAssetId ? assetDb.getById(reflectionSeparate.pxTextureAssetId, AssetType.Texture) : undefined,
        nxTexture: reflectionSeparate.nxTextureAssetId ? assetDb.getById(reflectionSeparate.nxTextureAssetId, AssetType.Texture) : undefined,
        pyTexture: reflectionSeparate.pyTextureAssetId ? assetDb.getById(reflectionSeparate.pyTextureAssetId, AssetType.Texture) : undefined,
        nyTexture: reflectionSeparate.nyTextureAssetId ? assetDb.getById(reflectionSeparate.nyTextureAssetId, AssetType.Texture) : undefined,
        pzTexture: reflectionSeparate.pzTextureAssetId ? assetDb.getById(reflectionSeparate.pzTextureAssetId, AssetType.Texture) : undefined,
        nzTexture: reflectionSeparate.nzTextureAssetId ? assetDb.getById(reflectionSeparate.nzTextureAssetId, AssetType.Texture) : undefined,
      } as MeshAssetMaterialOverrideReflectionDataOfType<TReflectionType>;
    }
    default:
      throw new Error(`Unimplemented reflection type '${(reflection as { 'type': string }).type}'`);
  }
}
