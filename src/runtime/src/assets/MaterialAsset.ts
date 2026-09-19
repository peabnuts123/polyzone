import { parse } from 'jsonc-parser';

import { Texture } from '@lopoly/engine/textures';
import { Color3 } from '@polyzone/core/math/Color3';
import { AssetType, Color3Definition, MeshAssetMaterialOverrideReflectionDefinition } from '@polyzone/runtime/cartridge/archive';
import { IAssetDb, IMaterialAssetData, ITextureAssetData, loadReflectionDefinition, MeshAssetMaterialOverrideReflectionData } from '@polyzone/runtime/cartridge/data';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';

export class MaterialAsset extends LoadedAssetBase<AssetType.Material> {
  public get type(): AssetType.Material { return AssetType.Material; }

  private _diffuseColor?: Color3;
  private _diffuseTexture?: Texture;
  private _emissionColor?: Color3;
  // private _reflectionTexture?: CubeTextureBabylon; // @TODO

  private constructor(id: string) {
    super(id);
  }

  public static async fromMaterialData(materialData: IMaterialData, assetData: IMaterialAssetData, context: AssetCacheContext): Promise<MaterialAsset> {
    const { assetCache } = context;

    // Construct material asset
    const materialAsset = new MaterialAsset(assetData.id);

    /* Diffuse color */
    materialAsset._diffuseColor = materialData.diffuseColor;

    /* Diffuse texture */
    if (materialData.diffuseTexture) {
      assetCache.registerDependency(assetData.id, materialData.diffuseTexture.id);
      const diffuseTexture = await assetCache.loadAsset(materialData.diffuseTexture);
      materialAsset._diffuseTexture = diffuseTexture.texture;
    }

    /* Emission color */
    materialAsset._emissionColor = materialData.emissionColor;

    /* Reflection */
    // @TODO bring back reflection
    // if (materialData.reflection) {
    //   const reflection = await ReflectionLoading.load(materialData.reflection, assetCache, scene);
    //   materialAsset._reflectionTexture = reflection?.texture;
    //   reflection?.textureAssetData.forEach((textureAssetData) => assetCache.registerDependency(assetData.id, textureAssetData.id));
    // }

    return materialAsset;
  }

  public static async fromAssetData(assetData: IMaterialAssetData, context: AssetCacheContext): Promise<MaterialAsset> {
    const { assetDb } = context;

    const assetFile = await assetDb.loadAsset(assetData);
    const materialDefinition = parse(assetFile.textContent) as MaterialDefinition;
    const materialData = MaterialData.fromDefinition(materialDefinition, assetDb);

    return this.fromMaterialData(materialData, assetData, context);
  }

  public get diffuseColor(): Color3 | undefined { return this._diffuseColor; }
  public get diffuseTexture(): Texture | undefined { return this._diffuseTexture; }
  public get emissionColor(): Color3 | undefined { return this._emissionColor; }
  // public get reflectionTexture(): CubeTextureBabylon | undefined { return this._reflectionTexture; }
}

export interface IMaterialData {
  get diffuseColor(): Color3 | undefined;
  set diffuseColor(value: Color3 | undefined);
  get diffuseTexture(): ITextureAssetData | undefined;
  set diffuseTexture(value: ITextureAssetData | undefined);
  get emissionColor(): Color3 | undefined;
  set emissionColor(value: Color3 | undefined);
  get reflection(): MeshAssetMaterialOverrideReflectionData | undefined;
  set reflection(value: MeshAssetMaterialOverrideReflectionData | undefined);
}

export class MaterialData implements IMaterialData {
  public diffuseColor: Color3 | undefined;
  public diffuseTexture: ITextureAssetData | undefined;
  public emissionColor: Color3 | undefined;
  public reflection: MeshAssetMaterialOverrideReflectionData | undefined;

  private constructor() {
  }

  public static fromDefinition(definition: MaterialDefinition, assetDb: IAssetDb): MaterialData {
    const materialData = new MaterialData();

    if (definition.diffuseColor) {
      materialData.diffuseColor = new Color3(definition.diffuseColor);
    }

    if (definition.diffuseTextureAssetId) {
      const diffuseTextureData = assetDb.getById(definition.diffuseTextureAssetId, AssetType.Texture);
      materialData.diffuseTexture = diffuseTextureData;
    }

    if (definition.emissionColor) {
      materialData.emissionColor = new Color3(definition.emissionColor);
    }

    if (definition.reflection) {
      materialData.reflection = loadReflectionDefinition(definition.reflection, assetDb);
    }

    return materialData;
  }
}

export interface MaterialDefinition {
  diffuseColor?: Color3Definition;
  diffuseTextureAssetId?: string;
  emissionColor?: Color3Definition;
  reflection?: MeshAssetMaterialOverrideReflectionDefinition;
}
