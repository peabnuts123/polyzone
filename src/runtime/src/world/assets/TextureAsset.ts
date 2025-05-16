import { Texture as TextureBabylon } from '@babylonjs/core/Materials/Textures/texture';
import { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture';
import { Engine } from '@babylonjs/core/Engines/engine';
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Scene as BabylonScene } from '@babylonjs/core/scene';

import {
  AssetType,
  ITextureAssetData,
  MeshAssetMaterialOverrideReflection3x2Data,
  MeshAssetMaterialOverrideReflection6x1Data,
  MeshAssetMaterialOverrideReflectionBoxNetData,
  MeshAssetMaterialOverrideReflectionData,
  MeshAssetMaterialOverrideReflectionSeparateData,
} from '@polyzone/runtime/src/cartridge';
import { debug_modTexture } from '@polyzone/runtime';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache, AssetCacheContext } from './AssetCache';
import { RetroMaterial } from "../../materials/RetroMaterial";


export class TextureAsset extends LoadedAssetBase<AssetType.Texture> {
  public get type(): AssetType.Texture { return AssetType.Texture; }

  private _texture: TextureBabylon;

  private constructor(id: string, texture: TextureBabylon) {
    super(id);
    this._texture = texture;
  }

  public static async fromAssetData(assetData: ITextureAssetData, context: AssetCacheContext): Promise<TextureAsset> {
    const { scene } = context;

    // @TODO Read texture bytes from AssetDB
    const texture = new TextureBabylon(assetData.babylonFetchUrl, scene, {
      noMipmap: true,
      samplingMode: TextureBabylon.NEAREST_SAMPLINGMODE,
      // invertY: false, // @TODO? For reflections?
    });

    // Load texture (async)
    await new Promise((resolve, reject) => {
      texture.onLoadObservable.addOnce(() => {
        if (texture.loadingError) {
          reject(texture.errorObject);
        } else {
          resolve(texture);
        }
      });
    });

    return new TextureAsset(assetData.id, texture);
  }

  public dispose(): void {
    this.texture.dispose();
  }

  public get texture(): TextureBabylon {
    return this._texture;
  }
}

export interface ReflectionLoadingResult {
  texture: CubeTexture;
  textureAssets: TextureAsset[];
  textureAssetData: ITextureAssetData[];
}

export abstract class ReflectionLoading {
  /**
   * Read a specific block of raw image data from the canvas.
   * The canvas is expected to be 4 cells wide and 3 cells tall.
   * @param ctx 2D HTML canvas rendering context
   * @param cellX X coordinate of the cell to read
   * @param cellY Y coordinate of the cell to read
   * @param cellSize Size (in pixels) of each cell (assumed to be square)
   */
  private static readCanvasCell(ctx: CanvasRenderingContext2D, cellX: number, cellY: number, cellSize: number): Uint8ClampedArray {
    const imageData = ctx.getImageData(cellX * cellSize, cellY * cellSize, cellSize, cellSize);
    return imageData.data;
  }

  private static async loadTextureToCanvas(texture: TextureBabylon): Promise<[HTMLCanvasElement, CanvasRenderingContext2D]> {
    // Read data from texture so we don't have to fetch it again (which would be MUCH easier)
    const cachedTextureSize = texture.getSize();
    const dataBuffer = await ReflectionLoading.readTextureData(texture);

    // Create HTML canvas
    const canvas = document.createElement('canvas');
    canvas.width = cachedTextureSize.width;
    canvas.height = cachedTextureSize.height;

    // Write texture data to canvas
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    imageData.data.set(dataBuffer);
    ctx.putImageData(imageData, 0, 0);

    return [canvas, ctx];
  }

  private static async readTextureData(texture: TextureBabylon): Promise<Uint8Array> {
    const cachedTextureSize = texture.getSize();
    const dataBuffer = new Uint8Array(cachedTextureSize.width * cachedTextureSize.height * 4/* @NOTE RGBA encoding */);
    await texture.readPixels(undefined, undefined, dataBuffer);
    return dataBuffer;
  }


  /**
   * Load a reflection texture from the given data.
   */
  public static async load(data: MeshAssetMaterialOverrideReflectionData, assetCache: AssetCache, scene: BabylonScene): Promise<ReflectionLoadingResult | undefined> {
    switch (data.type) {
      case "box-net":
        return ReflectionLoading.loadBoxNet(data, assetCache, scene);
      case "3x2":
        return ReflectionLoading.load3x2(data, assetCache, scene);
      case "6x1":
        return ReflectionLoading.load6x1(data, assetCache, scene);
      case "separate":
        return ReflectionLoading.loadSeparate(data, assetCache, scene);
      default:
        throw new Error(`Unimplemented MeshAssetMaterialOverrideReflectionType: ${(data as { type: any }).type}`);
    }
  }

  /**
   * Load texture from "box-net" layout.
   * ```
   *     0    1    2    3
   *   ┌────┬────┬────┬────┐
   * 0 │    │ +y │    │    │
   *   ├────┼────┼────┼────┤
   * 1 │ -x │ +z │ +x │ -z │
   *   ├────┼────┼────┼────┤
   * 2 │    │ -y │    │    │
   *   └────┴────┴────┴────┘
   * ```
   */
  public static async loadBoxNet(data: MeshAssetMaterialOverrideReflectionBoxNetData, assetCache: AssetCache, scene: BabylonScene): Promise<ReflectionLoadingResult | undefined> {
    if (data.texture === undefined) return undefined;

    // Load texture through cache
    const cachedTextureAsset = await assetCache.loadAsset(data.texture, scene);

    // Read texture into HTML canvas
    const [canvas, ctx] = await ReflectionLoading.loadTextureToCanvas(cachedTextureAsset.texture);

    // Read specific chunks of image data into array of `Uint8ClampedArray`
    const cellSize = canvas.width / 4;
    const textures = [
      ReflectionLoading.readCanvasCell(ctx, 2, 1, cellSize), // +x
      ReflectionLoading.readCanvasCell(ctx, 0, 1, cellSize), // -x
      ReflectionLoading.readCanvasCell(ctx, 1, 0, cellSize), // +y
      ReflectionLoading.readCanvasCell(ctx, 1, 2, cellSize), // -y
      ReflectionLoading.readCanvasCell(ctx, 1, 1, cellSize), // +z
      ReflectionLoading.readCanvasCell(ctx, 3, 1, cellSize), // -z
    ];

    const result = new RawCubeTexture(
      scene,
      textures,
      cellSize,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );

    result.level = data.strength ?? RetroMaterial.Defaults.reflectionStrength;
    debug_modTexture(result);

    return {
      texture: result,
      textureAssets: [cachedTextureAsset],
      textureAssetData: [data.texture],
    };
  }

  /**
   * Load texture from "3x2" layout.
   * ```
   *     0    1    2
   *   ┌────┬────┬────┐
   * 0 │ +x │ +y │ +z │
   *   ├────┼────┼────┤
   * 1 │ -x │ -y │ -z │
   *   └────┴────┴────┘
   * ```
   */
  public static async load3x2(data: MeshAssetMaterialOverrideReflection3x2Data, assetCache: AssetCache, scene: BabylonScene): Promise<ReflectionLoadingResult | undefined> {
    if (data.texture === undefined) return undefined;

    // Load texture through cache
    const cachedTextureAsset = await assetCache.loadAsset(data.texture, scene);

    // Read texture into HTML canvas
    const [canvas, ctx] = await ReflectionLoading.loadTextureToCanvas(cachedTextureAsset.texture);

    // Read specific chunks of image data into array of `Uint8ClampedArray`
    const cellSize = canvas.width / 4;
    const textures = [
      ReflectionLoading.readCanvasCell(ctx, 0, 0, cellSize), // +x
      ReflectionLoading.readCanvasCell(ctx, 0, 1, cellSize), // -x
      ReflectionLoading.readCanvasCell(ctx, 1, 0, cellSize), // +y
      ReflectionLoading.readCanvasCell(ctx, 1, 1, cellSize), // -y
      ReflectionLoading.readCanvasCell(ctx, 2, 0, cellSize), // +z
      ReflectionLoading.readCanvasCell(ctx, 2, 1, cellSize), // -z
    ];

    const result = new RawCubeTexture(
      scene,
      textures,
      cellSize,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );

    result.level = data.strength ?? RetroMaterial.Defaults.reflectionStrength;
    debug_modTexture(result);

    return {
      texture: result,
      textureAssets: [cachedTextureAsset],
      textureAssetData: [data.texture],
    };
  }

  /**
   * Load texture from "6x1" layout.
   * ```
   *     0    1    2    3    4    5
   *   ┌────┬────┬────┬────┬────┬────┐
   * 0 │ +x │ -x │ +y │ -y │ +z │ -z │
   *   └────┴────┴────┴────┴────┴────┘
   * ```
   */
  public static async load6x1(data: MeshAssetMaterialOverrideReflection6x1Data, assetCache: AssetCache, scene: BabylonScene): Promise<ReflectionLoadingResult | undefined> {
    if (data.texture === undefined) return undefined;

    // Load texture through cache
    const cachedTextureAsset = await assetCache.loadAsset(data.texture, scene);

    // Read texture into HTML canvas
    const [canvas, ctx] = await ReflectionLoading.loadTextureToCanvas(cachedTextureAsset.texture);

    // Read specific chunks of image data into array of `Uint8ClampedArray`
    const cellSize = canvas.width / 4;
    const textures = [
      ReflectionLoading.readCanvasCell(ctx, 0, 0, cellSize), // +x
      ReflectionLoading.readCanvasCell(ctx, 1, 0, cellSize), // -x
      ReflectionLoading.readCanvasCell(ctx, 2, 0, cellSize), // +y
      ReflectionLoading.readCanvasCell(ctx, 3, 0, cellSize), // -y
      ReflectionLoading.readCanvasCell(ctx, 4, 0, cellSize), // +z
      ReflectionLoading.readCanvasCell(ctx, 5, 0, cellSize), // -z
    ];

    const result = new RawCubeTexture(
      scene,
      textures,
      cellSize,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );

    result.level = data.strength ?? RetroMaterial.Defaults.reflectionStrength;
    debug_modTexture(result);

    return {
      texture: result,
      textureAssets: [cachedTextureAsset],
      textureAssetData: [data.texture],
    };
  }

  public static async loadSeparate(data: MeshAssetMaterialOverrideReflectionSeparateData, assetCache: AssetCache, scene: BabylonScene): Promise<ReflectionLoadingResult | undefined> {
    if (
      data.pxTexture === undefined ||
      data.nxTexture === undefined ||
      data.pyTexture === undefined ||
      data.nyTexture === undefined ||
      data.pzTexture === undefined ||
      data.nzTexture === undefined
    ) return undefined;

    // Load texture assets through cache
    const pxTextureAsset = await assetCache.loadAsset(data.pxTexture, scene);
    const nxTextureAsset = await assetCache.loadAsset(data.nxTexture, scene);
    const pyTextureAsset = await assetCache.loadAsset(data.pyTexture, scene);
    const nyTextureAsset = await assetCache.loadAsset(data.nyTexture, scene);
    const pzTextureAsset = await assetCache.loadAsset(data.pzTexture, scene);
    const nzTextureAsset = await assetCache.loadAsset(data.nzTexture, scene);

    // Read textures into raw buffers (doesn't seem to be an easy way to assemble a CubeTexture from 6 Texture assets)
    const textures = await Promise.all([
      ReflectionLoading.readTextureData(pxTextureAsset.texture),
      ReflectionLoading.readTextureData(nxTextureAsset.texture),
      ReflectionLoading.readTextureData(pyTextureAsset.texture),
      ReflectionLoading.readTextureData(nyTextureAsset.texture),
      ReflectionLoading.readTextureData(pzTextureAsset.texture),
      ReflectionLoading.readTextureData(nzTextureAsset.texture),
    ]);

    const result = new RawCubeTexture(
      scene,
      textures,
      pxTextureAsset.texture.getSize().width,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );

    result.level = data.strength ?? RetroMaterial.Defaults.reflectionStrength;
    debug_modTexture(result);

    return {
      texture: result,
      textureAssets: [
        pxTextureAsset,
        nxTextureAsset,
        pyTextureAsset,
        nyTextureAsset,
        pzTextureAsset,
        nzTextureAsset,
      ],
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
}
