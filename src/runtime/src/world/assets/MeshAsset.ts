import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader.js';
import { Scene as BabylonScene } from "@babylonjs/core/scene";
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture as TextureBabylon } from '@babylonjs/core/Materials/Textures/texture';

import { AssetType, IMeshAssetData, MeshAssetMaterialOverrideReflection3x2Data, MeshAssetMaterialOverrideReflection6x1Data, MeshAssetMaterialOverrideReflectionBoxNetData, MeshAssetMaterialOverrideReflectionSeparateData } from '@polyzone/runtime/src/cartridge';
import { debug_modTexture } from "@polyzone/runtime/src";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache } from './AssetCache';
import { toColor3Babylon } from '../../util';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture';
import { Engine } from '@babylonjs/core/Engines/engine';

export class MeshAsset extends LoadedAssetBase<AssetType.Mesh> {
  public get type(): AssetType.Mesh { return AssetType.Mesh; }

  private _assetContainer: AssetContainer;

  private constructor(assetContainer: AssetContainer) {
    super();
    this._assetContainer = assetContainer;
  }

  public static async fromAssetData(assetData: IMeshAssetData, scene: BabylonScene, assetCache: AssetCache): Promise<MeshAsset> {
    // Load mesh
    // @TODO can we rely on cache better? Is this the right thing to be using?
    const assetContainer = await LoadAssetContainerAsync(assetData.babylonFetchUrl, scene, { pluginExtension: assetData.fileExtension });

    // @TODO Store textures (and other assets) in assetCache

    for (const texture of assetContainer.textures) {
      debug_modTexture(texture);
    }

    // Replace every material with custom PolyZone material
    for (let i = 0; i < assetContainer.materials.length; i++) {
      const oldMaterial = assetContainer.materials[i];
      const newMaterial: RetroMaterial = new RetroMaterial(oldMaterial.name, assetContainer.scene);

      // Bind supported properties from original material
      if (oldMaterial instanceof StandardMaterial) {
        newMaterial.diffuseColor = oldMaterial.diffuseColor;
        newMaterial.diffuseTexture = oldMaterial.diffuseTexture || undefined;
        newMaterial.emissionColor = oldMaterial.emissiveColor;
        if (oldMaterial.reflectionTexture instanceof CubeTexture) { // Not sure this is even possible
          newMaterial.reflectionTexture = oldMaterial.reflectionTexture;
        }
      } else if (oldMaterial instanceof PBRMaterial) {
        newMaterial.diffuseColor = oldMaterial.albedoColor;
        newMaterial.diffuseTexture = oldMaterial.albedoTexture || undefined;
        newMaterial.emissionColor = oldMaterial.emissiveColor.multiplyByFloats(
          oldMaterial.emissiveIntensity,
          oldMaterial.emissiveIntensity,
          oldMaterial.emissiveIntensity,
        );
        if (oldMaterial.reflectionTexture instanceof CubeTexture) { // Not sure this is even possible
          newMaterial.reflectionTexture = oldMaterial.reflectionTexture;
        }
      } else {
        console.error(`[MeshAsset] (fromAssetData) Could not load material info. Unimplemented material type: `, oldMaterial);
        // @NOTE continue processing / replace material (it will just be blank, untextured etc.)
        // We do this so that we guarantee every mesh has our material.
      }

      // Set overrides
      const materialOverrideData = assetData.getOverridesForMaterial(oldMaterial.name);
      if (materialOverrideData !== undefined) {
        /* Diffuse color */
        if (materialOverrideData.diffuseColor !== undefined) {
          newMaterial.diffuseColor = toColor3Babylon(materialOverrideData.diffuseColor);
        }

        /* Diffuse texture */
        if (materialOverrideData.diffuseTexture !== undefined) {
          const textureAsset = await assetCache.loadAsset(materialOverrideData.diffuseTexture, scene);
          newMaterial.diffuseTexture = textureAsset.texture;
        }

        /* Emission color */
        if (materialOverrideData.emissionColor !== undefined) {
          newMaterial.emissionColor = toColor3Babylon(materialOverrideData.emissionColor);
        }

        /* Reflection */
        if (materialOverrideData.reflection !== undefined) {
          console.log(`Original reflection level: ${newMaterial.reflectionTexture?.level}`);
          switch (materialOverrideData.reflection.type) {
            case 'box-net': {
              newMaterial.reflectionTexture = await ReflectionLoading.loadBoxNet(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            case '3x2': {
              newMaterial.reflectionTexture = await ReflectionLoading.load3x2(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            case '6x1': {
              newMaterial.reflectionTexture = await ReflectionLoading.load6x1(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            case 'separate': {
              newMaterial.reflectionTexture = await ReflectionLoading.loadSeparate(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            default:
              throw new Error(`Unimplemented reflection type '${(materialOverrideData.reflection as { 'type': string }).type}'`);
          }
          newMaterial.reflectionTexture.level = 0.2;
          console.log(`New reflection level: ${newMaterial.reflectionTexture.level}`);
        }
      }

      // Replace material in scene
      assetContainer.scene.removeMaterial(oldMaterial);
      assetContainer.scene.addMaterial(newMaterial);

      // Find any meshes referencing the old material and replace them
      for (const mesh of assetContainer.meshes) {
        if (mesh.material?.name === oldMaterial.name) {
          mesh.material = newMaterial;
        }
      }

      // Update the container, IDK
      assetContainer.materials[i] = newMaterial;
      oldMaterial.dispose();
    }

    return new MeshAsset(assetContainer);
  }

  public override dispose(): void {
    this.assetContainer.dispose();
  }

  public get assetContainer(): AssetContainer { return this._assetContainer; }
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
  public static async loadBoxNet(data: MeshAssetMaterialOverrideReflectionBoxNetData, assetCache: AssetCache, scene: BabylonScene): Promise<CubeTexture> {
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

    return new RawCubeTexture(
      scene,
      textures,
      cellSize,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );
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
  public static async load3x2(data: MeshAssetMaterialOverrideReflection3x2Data, assetCache: AssetCache, scene: BabylonScene): Promise<CubeTexture> {
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

    return new RawCubeTexture(
      scene,
      textures,
      cellSize,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );
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
  public static async load6x1(data: MeshAssetMaterialOverrideReflection6x1Data, assetCache: AssetCache, scene: BabylonScene): Promise<CubeTexture> {
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

    return new RawCubeTexture(
      scene,
      textures,
      cellSize,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );
  }

  public static async loadSeparate(data: MeshAssetMaterialOverrideReflectionSeparateData, assetCache: AssetCache, scene: BabylonScene): Promise<CubeTexture> {
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

    return new RawCubeTexture(
      scene,
      textures,
      pxTextureAsset.texture.getSize().width,
      Engine.TEXTUREFORMAT_RGBA,
      Engine.TEXTURETYPE_UNSIGNED_BYTE,
    );
  }
}
