import { Color3 } from "@polyzone/core/math/Color3";

import { AssetType, MeshAssetDefinition, MeshAssetMaterialOverrideDefinition, MeshAssetMaterialOverrideReflectionBoxNetDefinition, MeshAssetMaterialOverrideReflectionDefinitionOfType, MeshAssetMaterialOverrideReflectionSeparateDefinition, MeshAssetMaterialOverrideReflectionType } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";
import { ITextureAssetData } from "./TextureAssetData";
import { IMaterialAssetData } from "./MaterialAssetData";

export interface MeshAssetMaterialOverrideReflectionBoxNetData {
  type: 'box-net',
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

export type MeshAssetMaterialOverrideReflectionData = MeshAssetMaterialOverrideReflectionBoxNetData | MeshAssetMaterialOverrideReflectionSeparateData;
export type MeshAssetMaterialOverrideReflectionDataOfType<T extends MeshAssetMaterialOverrideReflectionType> = Extract<MeshAssetMaterialOverrideReflectionData, { type: T }>;

export interface IMeshAssetMaterialOverrideData {
  get material(): IMaterialAssetData | undefined;
  get diffuseColor(): Color3 | undefined;
  get diffuseTexture(): ITextureAssetData | undefined;
  get reflection(): MeshAssetMaterialOverrideReflectionData | undefined;
  get lightingEnabled(): boolean | undefined;
}

export class MeshAssetMaterialOverrideData implements IMeshAssetMaterialOverrideData {
  public material: IMaterialAssetData | undefined;
  public diffuseColor: Color3 | undefined;
  public diffuseTexture: ITextureAssetData | undefined;
  public reflection: MeshAssetMaterialOverrideReflectionData | undefined;
  public lightingEnabled: boolean | undefined;

  public static createFrom(definition: MeshAssetMaterialOverrideDefinition, assetDb: IAssetDb): MeshAssetMaterialOverrideData {
    const self = new MeshAssetMaterialOverrideData();

    if (definition.materialAssetId) {
      self.material = assetDb.getById(definition.materialAssetId, AssetType.Material);
    }
    if (definition.diffuseColor) {
      self.diffuseColor = new Color3(definition.diffuseColor);
    }
    if (definition.diffuseTextureAssetId) {
      self.diffuseTexture = assetDb.getById(definition.diffuseTextureAssetId, AssetType.Texture);
    }
    if (definition.reflection) {
      self.reflection = loadReflectionDefinition(definition.reflection, assetDb);
    }
    self.lightingEnabled = definition.lightingEnabled;

    return self;
  }
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
