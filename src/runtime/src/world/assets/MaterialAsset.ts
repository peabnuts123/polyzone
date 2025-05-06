import { parse } from 'jsonc-parser';
import { Texture as TextureBabylon } from '@babylonjs/core/Materials/Textures/texture';
import { CubeTexture as CubeTextureBabylon } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';

import Resolver from '@polyzone/runtime/src/Resolver';
import { AssetType, ColorDefinition, IMaterialAssetData, loadReflectionDefinition, MeshAssetMaterialOverrideReflectionDefinition } from '@polyzone/runtime/src/cartridge';
import { toColor3Babylon } from "@polyzone/runtime/src/util";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';
import { ReflectionLoading } from './TextureAsset';

export class MaterialAsset extends LoadedAssetBase<AssetType.Material> {
  public get type(): AssetType.Material { return AssetType.Material; }

  private _diffuseColor?: Color3Babylon;
  private _diffuseTexture?: TextureBabylon;
  private _emissionColor?: Color3Babylon;
  private _reflectionTexture?: CubeTextureBabylon;

  private constructor() {
    super();
  }

  public static async fromAssetData(assetData: IMaterialAssetData, context: AssetCacheContext): Promise<MaterialAsset> {
    const { assetCache, assetDb } = context;

    // Fetch using babylon
    const response = await fetch(Resolver.resolve(assetData.babylonFetchUrl));
    const responseText = await response.text();
    const data = parse(responseText) as MaterialDefinition;

    const materialAsset = new MaterialAsset();

    /* Diffuse color */
    materialAsset._diffuseColor = data.diffuseColor ? toColor3Babylon(data.diffuseColor) : undefined;

    /* Diffuse texture */
    if (data.diffuseTextureAssetId) {
      const diffuseTextureData = assetDb.getById(data.diffuseTextureAssetId, AssetType.Texture);
      const diffuseTexture = await assetCache.loadAsset(diffuseTextureData, context);
      materialAsset._diffuseTexture = diffuseTexture.texture;
    }

    /* Emission color */
    materialAsset._emissionColor = data.emissionColor ? toColor3Babylon(data.emissionColor) : undefined;

    /* Reflection */
    if (data.reflection) {
      const reflectionData = loadReflectionDefinition(data.reflection, assetDb);
      const reflectionTexture = await ReflectionLoading.load(reflectionData, context);
      materialAsset._reflectionTexture = reflectionTexture;
    }

    return materialAsset;
  }

  public get diffuseColor(): Color3Babylon | undefined { return this._diffuseColor; }
  public get diffuseTexture(): TextureBabylon | undefined { return this._diffuseTexture; }
  public get emissionColor(): Color3Babylon | undefined { return this._emissionColor; }
  public get reflectionTexture(): CubeTextureBabylon | undefined { return this._reflectionTexture; }
}

interface MaterialDefinition {
  diffuseColor?: ColorDefinition;
  diffuseTextureAssetId?: string;
  emissionColor?: ColorDefinition;
  reflection?: MeshAssetMaterialOverrideReflectionDefinition;
}
