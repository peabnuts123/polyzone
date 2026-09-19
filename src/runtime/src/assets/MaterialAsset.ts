import { parse } from 'jsonc-parser';

import { Cubemap, Texture } from '@lopoly/engine/textures';
import { Color3 } from '@polyzone/core/math/Color3';
import { AssetType, Color3Definition, MeshAssetMaterialOverrideReflectionDefinition } from '@polyzone/runtime/cartridge/archive';
import { IAssetDb, IMaterialAssetData, ITextureAssetData, loadReflectionDefinition, MeshAssetMaterialOverrideReflectionData } from '@polyzone/runtime/cartridge/data';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';
import { ReflectionLoading } from './TextureAsset';

export class MaterialAsset extends LoadedAssetBase<AssetType.Material> {
  public get type(): AssetType.Material { return AssetType.Material; }

  private _diffuseColor?: Color3;
  private _diffuseTexture?: Texture;
  private _reflectionCubemap?: Cubemap;
  private _reflectionStrength?: number;
  private _lightingEnabled?: boolean;

  private constructor(id: string) {
    super(id);
  }

  public static async fromMaterialData(materialData: IMaterialData, assetData: IMaterialAssetData, context: AssetCacheContext): Promise<MaterialAsset> {
    const { engine, assetCache } = context;

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

    /* Reflection */
    if (materialData.reflection) {
      const reflection = await ReflectionLoading.load(materialData.reflection, assetCache, engine);
      if (reflection) {
        materialAsset._reflectionCubemap = reflection.cubemap;
        materialAsset._reflectionStrength = reflection.strength;
        reflection.textureAssetData.forEach((textureAssetData) => assetCache.registerDependency(assetData.id, textureAssetData.id));
      }
    }

    /* Lighting */
    materialAsset._lightingEnabled = materialData.lightingEnabled;

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
  public get reflectionCubemap(): Cubemap | undefined { return this._reflectionCubemap; }
  public get reflectionStrength(): number | undefined { return this._reflectionStrength; }
  public get lightingEnabled(): boolean | undefined { return this._lightingEnabled; }
}

export interface IMaterialData {
  get diffuseColor(): Color3 | undefined;
  set diffuseColor(value: Color3 | undefined);
  get diffuseTexture(): ITextureAssetData | undefined;
  set diffuseTexture(value: ITextureAssetData | undefined);
  get reflection(): MeshAssetMaterialOverrideReflectionData | undefined;
  set reflection(value: MeshAssetMaterialOverrideReflectionData | undefined);
  get lightingEnabled(): boolean | undefined;
  set lightingEnabled(value: boolean | undefined);
}

export class MaterialData implements IMaterialData {
  public diffuseColor: Color3 | undefined;
  public diffuseTexture: ITextureAssetData | undefined;
  public reflection: MeshAssetMaterialOverrideReflectionData | undefined;
  public lightingEnabled: boolean | undefined;

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

    if (definition.reflection) {
      materialData.reflection = loadReflectionDefinition(definition.reflection, assetDb);
    }

    materialData.lightingEnabled = definition.lightingEnabled;

    return materialData;
  }
}

export interface MaterialDefinition {
  diffuseColor?: Color3Definition;
  diffuseTextureAssetId?: string;
  reflection?: MeshAssetMaterialOverrideReflectionDefinition;
  lightingEnabled?: boolean;
}
