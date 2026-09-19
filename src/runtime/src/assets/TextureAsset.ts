import { Cubemap, Texture } from '@lopoly/engine/textures';

import { AssetType } from '@polyzone/runtime/cartridge/archive';
import {
  ITextureAssetData,
  MeshAssetMaterialOverrideReflectionData,
} from '@polyzone/runtime/cartridge/data';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache, AssetCacheContext } from './AssetCache';
import { IEngine } from '@lopoly/engine';

export class TextureAsset extends LoadedAssetBase<AssetType.Texture> {
  public get type(): AssetType.Texture { return AssetType.Texture; }

  public readonly texture: Texture;

  private constructor(id: string, texture: Texture) {
    super(id);
    this.texture = texture;
  }

  public static async fromAssetData(assetData: ITextureAssetData, context: AssetCacheContext): Promise<TextureAsset> {
    const { engine, assetDb } = context;

    const textureFile = await assetDb.loadAsset(assetData);

    const texture = await Texture.loadFromBuffer(engine, textureFile.bytes);

    return new TextureAsset(assetData.id, texture);
  }
}

export interface ReflectionLoadingResult {
  cubemap: Cubemap;
  strength: number;
  textureAssetData: ITextureAssetData[];
}

export abstract class ReflectionLoading {
  public static async load(data: MeshAssetMaterialOverrideReflectionData, assetCache: AssetCache, engine: IEngine): Promise<ReflectionLoadingResult | undefined> {
    switch (data.type) {
      case 'box-net':
        if (data.texture) {
          // @TODO LoPoly update - read from buffer
          const cubemap = await Cubemap.loadBoxNet(engine, data.texture.path);
          const strength = data.strength ?? 1;
          return {
            cubemap,
            strength,
            textureAssetData: [data.texture],
          };
        }
        break;
      case 'separate':
        if (
          data.pxTexture !== undefined &&
          data.nxTexture !== undefined &&
          data.pyTexture !== undefined &&
          data.nyTexture !== undefined &&
          data.pzTexture !== undefined &&
          data.nzTexture !== undefined
        ) {
          // @TODO LoPoly update - read from buffer
          const cubemap = await Cubemap.loadSeparate(engine, {
            right: data.pxTexture.path,
            left: data.nxTexture.path,
            up: data.pyTexture.path,
            down: data.nyTexture.path,
            forward: data.pzTexture.path,
            back: data.nzTexture.path,
          });
          const strength = data.strength ?? 1;
          return {
            cubemap,
            strength,
            textureAssetData: [
              data.pxTexture,
              data.nxTexture,
              data.pyTexture,
              data.nyTexture,
              data.pzTexture,
              data.nzTexture,
            ],
          };
        }
        break;
      default:
        throw new Error(`Unimplemented reflection type: ${(data as { type: unknown }).type}`);
    }
  }
}
