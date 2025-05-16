import { parse } from 'jsonc-parser';
import { Texture as TextureBabylon } from '@babylonjs/core/Materials/Textures/texture';
import { CubeTexture as CubeTextureBabylon } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';

import { Color3 } from '@polyzone/core/src/util';
import { AssetType, ColorDefinition, IAssetDb, IMaterialAssetData, ITextureAssetData, loadReflectionDefinition, MeshAssetMaterialOverrideReflectionData, MeshAssetMaterialOverrideReflectionDefinition } from '@polyzone/runtime/src/cartridge';
import { toColor3Babylon, toColor3Core } from "@polyzone/runtime/src/util";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';
import { ReflectionLoading } from './TextureAsset';

export class MaterialAsset extends LoadedAssetBase<AssetType.Material> {
  public get type(): AssetType.Material { return AssetType.Material; }

  private _diffuseColor?: Color3Babylon;
  private _diffuseTexture?: TextureBabylon;
  private _emissionColor?: Color3Babylon;
  private _reflectionTexture?: CubeTextureBabylon;

  private constructor(id: string) {
    super(id);
  }

  public static async fromMaterialData(materialData: IMaterialData, assetData: IMaterialAssetData, context: AssetCacheContext): Promise<MaterialAsset> {
    const { assetCache, scene } = context;

    // Construct material asset
    const materialAsset = new MaterialAsset(assetData.id);

    /* Diffuse color */
    materialAsset._diffuseColor = materialData.diffuseColor ? toColor3Babylon(materialData.diffuseColor) : undefined;

    /* Diffuse texture */
    if (materialData.diffuseTexture) {
      assetCache.registerDependency(assetData.id, materialData.diffuseTexture.id);
      const diffuseTexture = await assetCache.loadAsset(materialData.diffuseTexture, scene);
      materialAsset._diffuseTexture = diffuseTexture.texture;
    }

    /* Emission color */
    materialAsset._emissionColor = materialData.emissionColor ? toColor3Babylon(materialData.emissionColor) : undefined;

    /* Reflection */
    if (materialData.reflection) {
      const reflection = await ReflectionLoading.load(materialData.reflection, assetCache, scene);
      materialAsset._reflectionTexture = reflection?.texture;
      reflection?.textureAssetData.forEach((textureAssetData) => assetCache.registerDependency(assetData.id, textureAssetData.id));
    }

    return materialAsset;
  }

  public static async fromAssetData(assetData: IMaterialAssetData, context: AssetCacheContext): Promise<MaterialAsset> {
    const { assetDb } = context;

    // Fetch using babylon
    const assetFile = await assetDb.loadAsset(assetData);
    const materialDefinition = parse(assetFile.textContent) as MaterialDefinition;
    const materialData = MaterialData.fromDefinition(materialDefinition, assetDb);

    return this.fromMaterialData(materialData, assetData, context);
  }

  public get diffuseColor(): Color3Babylon | undefined { return this._diffuseColor; }
  public get diffuseTexture(): TextureBabylon | undefined { return this._diffuseTexture; }
  public get emissionColor(): Color3Babylon | undefined { return this._emissionColor; }
  public get reflectionTexture(): CubeTextureBabylon | undefined { return this._reflectionTexture; }
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
      materialData.diffuseColor = toColor3Core(definition.diffuseColor);
    }

    if (definition.diffuseTextureAssetId) {
      const diffuseTextureData = assetDb.getById(definition.diffuseTextureAssetId, AssetType.Texture);
      materialData.diffuseTexture = diffuseTextureData;
    }

    if (definition.emissionColor) {
      materialData.emissionColor = toColor3Core(definition.emissionColor);
    }

    if (definition.reflection) {
      materialData.reflection = loadReflectionDefinition(definition.reflection, assetDb);
    }

    return materialData;
  }
}

export interface MaterialDefinition {
  diffuseColor?: ColorDefinition;
  diffuseTextureAssetId?: string;
  emissionColor?: ColorDefinition;
  reflection?: MeshAssetMaterialOverrideReflectionDefinition;
}
