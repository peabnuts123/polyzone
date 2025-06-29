// import type { Observer } from "@babylonjs/core/Misc/observable";
// import { SmartArray } from "@babylonjs/core/Misc/smartArray";
import type { IAnimatable } from "@babylonjs/core/Animations/animatable.interface";

import { Scene } from "@babylonjs/core/scene";
import type { Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { SubMesh } from "@babylonjs/core/Meshes/subMesh";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";
// import { PrePassConfiguration } from "@babylonjs/core/Materials/prePassConfiguration";

import type { IImageProcessingConfigurationDefines } from "@babylonjs/core/Materials/imageProcessingConfiguration.defines";
// import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration";
// import type { ColorCurves } from "@babylonjs/core/Materials/colorCurves";
// import type { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters";
// import type { ICustomShaderNameResolveOptions } from "@babylonjs/core/Materials/material";
// import { Material } from "@babylonjs/core/Materials/material";
import { MaterialPluginEvent } from "@babylonjs/core/Materials/materialPluginEvent";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial";

import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
// import type { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
// import { RegisterClass } from "@babylonjs/core/Misc/typeStore";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags";

import { Constants } from "@babylonjs/core/Engines/constants";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks";
import type { /* Effect, */ IEffectCreationOptions, IShaderPath } from "@babylonjs/core/Materials/effect";
// import { DetailMapConfiguration } from "@babylonjs/core/Materials/material.detailMapConfiguration";
import { AddClipPlaneUniforms, BindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper";
import {
  BindBonesParameters,
  BindFogParameters,
  BindLights,
  BindLogDepth,
  BindMorphTargetParameters,
  BindTextureMatrix,
  HandleFallbacksForShadows,
  PrepareAttributesForBakedVertexAnimation,
  PrepareAttributesForBones,
  PrepareAttributesForInstances,
  PrepareAttributesForMorphTargets,
  PrepareDefinesForAttributes,
  PrepareDefinesForFrameBoundValues,
  PrepareDefinesForLights,
  PrepareDefinesForMergedUV,
  PrepareDefinesForMisc,
  // PrepareDefinesForMultiview,
  // PrepareDefinesForOIT,
  // PrepareDefinesForPrePass,
  PrepareUniformsAndSamplersList,
} from "@babylonjs/core/Materials/materialHelper.functions";
// import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization";
// import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { MaterialHelperGeometryRendering } from "@babylonjs/core/Materials/materialHelper.geometryrendering";
// import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";


/* @TODO LITERALLY WTF LOL */

/* NEEDED? */
/* __decl__default(Fragment|Vertex) */
import "@babylonjs/core/Shaders/ShadersInclude/defaultUboDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/defaultVertexDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/defaultFragmentDeclaration";

/* __decl__lightVxFragment */
import "@babylonjs/core/Shaders/ShadersInclude/lightVxUboDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/lightVxFragmentDeclaration";

/* __decl__lightFragment */
import "@babylonjs/core/Shaders/ShadersInclude/lightUboDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/lightFragmentDeclaration";


// NEEDED
import "@babylonjs/core/Shaders/ShadersInclude/mainUVVaryingDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/helperFunctions";
/* Vertex-only */
import "@babylonjs/core/Shaders/ShadersInclude/uvAttributeDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/uvVariableDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/bonesDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/fogVertexDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/bonesVertex";
import "@babylonjs/core/Shaders/ShadersInclude/fogVertex";
import "@babylonjs/core/Shaders/ShadersInclude/vertexColorMixing";
/* Fragment-only */
import "@babylonjs/core/Shaders/ShadersInclude/samplerFragmentDeclaration"; // @TODO Inline
import "@babylonjs/core/Shaders/ShadersInclude/fogFragmentDeclaration";
import "@babylonjs/core/Shaders/ShadersInclude/lightsFragmentFunctions";
import "@babylonjs/core/Shaders/ShadersInclude/reflectionFunction";
import "@babylonjs/core/Shaders/ShadersInclude/lightFragment";
import "@babylonjs/core/Shaders/ShadersInclude/fogFragment";


// import "@babylonjs/core/Shaders/ShadersInclude/prePassVertexDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/samplerVertexDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/bumpVertexDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/morphTargetsVertexGlobalDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/morphTargetsVertexDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/morphTargetsVertexGlobal"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/morphTargetsVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/prePassVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/samplerVertexImplementation"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/bumpVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/shadowsVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/pointCloudVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/logDepthVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/oitDeclaration";
// import "@babylonjs/core/Shaders/ShadersInclude/shadowsFragmentFunctions";
// import "@babylonjs/core/Shaders/ShadersInclude/fresnelFunction";
// import "@babylonjs/core/Shaders/ShadersInclude/prePassDeclaration";
// import "@babylonjs/core/Shaders/ShadersInclude/imageProcessingDeclaration";
// import "@babylonjs/core/Shaders/ShadersInclude/imageProcessingFunctions";
// import "@babylonjs/core/Shaders/ShadersInclude/bumpFragmentMainFunctions";
// import "@babylonjs/core/Shaders/ShadersInclude/bumpFragmentFunctions";
// import "@babylonjs/core/Shaders/ShadersInclude/bumpFragment";
// import "@babylonjs/core/Shaders/ShadersInclude/decalFragment";
// import "@babylonjs/core/Shaders/ShadersInclude/depthPrePass";
// import "@babylonjs/core/Shaders/ShadersInclude/logDepthFragment";
// import "@babylonjs/core/Shaders/ShadersInclude/oitFragment";
// import "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimationDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertexDeclaration"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/instancesVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimation"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertex"; /* @NOTE UNNEEDED */
// import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
// import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragment";

// import { defaultVertexShader } from "@babylonjs/core/Shaders/default.vertex.js";
// import { defaultPixelShader } from "@babylonjs/core/Shaders/default.fragment.js";

import MasterVertexShaderSource from './shaders/master.vertex.fx';
import MasterFragmentShaderSource from './shaders/master.fragment.fx';
import { MaterialAsset } from "../world";


/** @internal */
export class RetroMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
  public MAINUV1 = false;
  public MAINUV2 = false;
  public MAINUV3 = false;
  public MAINUV4 = false;
  public MAINUV5 = false;
  public MAINUV6 = false;
  public DIFFUSE = false;
  public DIFFUSEDIRECTUV = 0;
  public BAKED_VERTEX_ANIMATION_TEXTURE = false;
  public AMBIENT = false;
  public AMBIENTDIRECTUV = 0;
  public OPACITY = false;
  public OPACITYDIRECTUV = 0;
  public OPACITYRGB = false;
  public REFLECTION = false;
  public EMISSIVE = false;
  public EMISSIVEDIRECTUV = 0;
  public SPECULAR = false;
  public SPECULARDIRECTUV = 0;
  public BUMP = false;
  public BUMPDIRECTUV = 0;
  public PARALLAX = false;
  public PARALLAX_RHS = false;
  public PARALLAXOCCLUSION = false;
  public SPECULAROVERALPHA = false;
  public CLIPPLANE = false;
  public CLIPPLANE2 = false;
  public CLIPPLANE3 = false;
  public CLIPPLANE4 = false;
  public CLIPPLANE5 = false;
  public CLIPPLANE6 = false;
  public ALPHATEST = false;
  public DEPTHPREPASS = false;
  public ALPHAFROMDIFFUSE = false;
  public POINTSIZE = false;
  public FOG = false;
  public SPECULARTERM = false;
  public DIFFUSEFRESNEL = false;
  public OPACITYFRESNEL = false;
  public REFLECTIONFRESNEL = false;
  public REFRACTIONFRESNEL = false;
  public EMISSIVEFRESNEL = false;
  public FRESNEL = false;
  public NORMAL = false;
  public TANGENT = false;
  public UV1 = false;
  public UV2 = false;
  public UV3 = false;
  public UV4 = false;
  public UV5 = false;
  public UV6 = false;
  public VERTEXCOLOR = false;
  public VERTEXALPHA = false;
  public NUM_BONE_INFLUENCERS = 0;
  public BonesPerMesh = 0;
  public BONETEXTURE = false;
  public BONES_VELOCITY_ENABLED = false;
  public INSTANCES = false;
  public THIN_INSTANCES = false;
  public INSTANCESCOLOR = false;
  public GLOSSINESS = false;
  public ROUGHNESS = false;
  // public EMISSIVEASILLUMINATION = false;
  // public LINKEMISSIVEWITHDIFFUSE = false;
  public REFLECTIONFRESNELFROMSPECULAR = false;
  public LIGHTMAP = false;
  public LIGHTMAPDIRECTUV = 0;
  public OBJECTSPACE_NORMALMAP = false;
  public USELIGHTMAPASSHADOWMAP = false;
  public REFLECTIONMAP_3D = false;
  public REFLECTIONMAP_SPHERICAL = false;
  public REFLECTIONMAP_PLANAR = false;
  public REFLECTIONMAP_CUBIC = false;
  public USE_LOCAL_REFLECTIONMAP_CUBIC = false;
  public USE_LOCAL_REFRACTIONMAP_CUBIC = false;
  public REFLECTIONMAP_PROJECTION = false;
  public REFLECTIONMAP_SKYBOX = false;
  public REFLECTIONMAP_EXPLICIT = false;
  public REFLECTIONMAP_EQUIRECTANGULAR = false;
  public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
  public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
  public REFLECTIONMAP_OPPOSITEZ = false;
  public INVERTCUBICMAP = false;
  public LOGARITHMICDEPTH = false;
  public REFRACTION = false;
  public REFRACTIONMAP_3D = false;
  public REFLECTIONOVERALPHA = false;
  public TWOSIDEDLIGHTING = false;
  public SHADOWFLOAT = false;
  public MORPHTARGETS = false;
  public MORPHTARGETS_POSITION = false;
  public MORPHTARGETS_NORMAL = false;
  public MORPHTARGETS_TANGENT = false;
  public MORPHTARGETS_UV = false;
  public MORPHTARGETS_UV2 = false;
  public MORPHTARGETS_COLOR = false;
  public MORPHTARGETTEXTURE_HASPOSITIONS = false;
  public MORPHTARGETTEXTURE_HASNORMALS = false;
  public MORPHTARGETTEXTURE_HASTANGENTS = false;
  public MORPHTARGETTEXTURE_HASUVS = false;
  public MORPHTARGETTEXTURE_HASUV2S = false;
  public MORPHTARGETTEXTURE_HASCOLORS = false;
  public NUM_MORPH_INFLUENCERS = 0;
  public MORPHTARGETS_TEXTURE = false;
  public NONUNIFORMSCALING = false; // https://playground.babylonjs.com#V6DWIH
  public PREMULTIPLYALPHA = false; // https://playground.babylonjs.com#LNVJJ7
  public ALPHATEST_AFTERALLALPHACOMPUTATIONS = false;
  public ALPHABLEND = true;

  public PREPASS = false;
  public PREPASS_COLOR = false;
  public PREPASS_COLOR_INDEX = -1;
  public PREPASS_IRRADIANCE = false;
  public PREPASS_IRRADIANCE_INDEX = -1;
  public PREPASS_ALBEDO = false;
  public PREPASS_ALBEDO_INDEX = -1;
  public PREPASS_ALBEDO_SQRT = false;
  public PREPASS_ALBEDO_SQRT_INDEX = -1;
  public PREPASS_DEPTH = false;
  public PREPASS_DEPTH_INDEX = -1;
  public PREPASS_SCREENSPACE_DEPTH = false;
  public PREPASS_SCREENSPACE_DEPTH_INDEX = -1;
  public PREPASS_NORMAL = false;
  public PREPASS_NORMAL_INDEX = -1;
  public PREPASS_NORMAL_WORLDSPACE = false;
  public PREPASS_WORLD_NORMAL = false;
  public PREPASS_WORLD_NORMAL_INDEX = -1;
  public PREPASS_POSITION = false;
  public PREPASS_POSITION_INDEX = -1;
  public PREPASS_LOCAL_POSITION = false;
  public PREPASS_LOCAL_POSITION_INDEX = -1;
  public PREPASS_VELOCITY = false;
  public PREPASS_VELOCITY_INDEX = -1;
  public PREPASS_VELOCITY_LINEAR = false;
  public PREPASS_VELOCITY_LINEAR_INDEX = -1;
  public PREPASS_REFLECTIVITY = false;
  public PREPASS_REFLECTIVITY_INDEX = -1;
  public SCENE_MRT_COUNT = 0;

  public RGBDLIGHTMAP = false;
  public RGBDREFLECTION = false;
  public RGBDREFRACTION = false;

  public IMAGEPROCESSING = false;
  public VIGNETTE = false;
  public VIGNETTEBLENDMODEMULTIPLY = false;
  public VIGNETTEBLENDMODEOPAQUE = false;
  public TONEMAPPING = 0;
  public CONTRAST = false;
  public COLORCURVES = false;
  public COLORGRADING = false;
  public COLORGRADING3D = false;
  public SAMPLER3DGREENDEPTH = false;
  public SAMPLER3DBGRMAP = false;
  public DITHER = false;
  public IMAGEPROCESSINGPOSTPROCESS = false;
  public SKIPFINALCOLORCLAMP = false;
  public MULTIVIEW = false;
  public ORDER_INDEPENDENT_TRANSPARENCY = false;
  public ORDER_INDEPENDENT_TRANSPARENCY_16BITS = false;
  public CAMERA_ORTHOGRAPHIC = false;
  public CAMERA_PERSPECTIVE = false;
  public AREALIGHTSUPPORTED = true;

  /**
   * If the reflection texture on this material is in linear color space
   * @internal
   */
  public IS_REFLECTION_LINEAR = false;
  /**
   * If the refraction texture on this material is in linear color space
   * @internal
   */
  public IS_REFRACTION_LINEAR = false;
  public EXPOSURE = false;

  public DECAL_AFTER_DETAIL = false;

  /**
   * Initializes the Standard Material defines.
   * @param externalProperties The external properties
   */
  constructor(externalProperties?: { [name: string]: { type: string; default: any } }) {
    super(externalProperties);
    this.rebuild();
  }

  public setReflectionMode(modeToEnable: string): void {
    const modes = [
      "REFLECTIONMAP_CUBIC",
      "REFLECTIONMAP_EXPLICIT",
      "REFLECTIONMAP_PLANAR",
      "REFLECTIONMAP_PROJECTION",
      "REFLECTIONMAP_PROJECTION",
      "REFLECTIONMAP_SKYBOX",
      "REFLECTIONMAP_SPHERICAL",
      "REFLECTIONMAP_EQUIRECTANGULAR",
      "REFLECTIONMAP_EQUIRECTANGULAR_FIXED",
      "REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED",
    ];

    for (const mode of modes) {
      this[mode] = mode === modeToEnable;
    }
  }
}

export class RetroMaterialOverrides {
  private retroMaterial: RetroMaterial;

  public constructor(retroMaterial: RetroMaterial) {
    this.retroMaterial = retroMaterial;
  }

  /**
   * The basic color of the material as viewed under a light.
   */
  public diffuseColor: Color3 | undefined = undefined;
  /**
   * The basic texture of the material as viewed under a light.
   */
  private _diffuseTexture: BaseTexture | undefined = undefined;
  public get diffuseTexture(): BaseTexture | undefined { return this._diffuseTexture; }
  public set diffuseTexture(value: BaseTexture | undefined) {
    this._diffuseTexture = value;
    this.retroMaterial.markAsDirty(Material.TextureDirtyFlag);
    void this.retroMaterial.recalculateTransparencyMode();
  }
  /**
   * Define the texture used to display the reflection.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
   */
  private _reflectionTexture: CubeTexture | undefined = undefined;
  public get reflectionTexture(): CubeTexture | undefined { return this._reflectionTexture; }
  public set reflectionTexture(value: CubeTexture | undefined) {
    this._reflectionTexture = value;
    this.retroMaterial.markAsDirty(Material.TextureDirtyFlag);
  }
  /**
   * Define the color of the material as if self lit.
   * This will be mixed in the final result even in the absence of light.
   */
  public emissionColor: Color3 | undefined = undefined;
}


export class RetroMaterial extends PushMaterial {
  public static readonly Defaults = {
    reflectionStrength: 0.5,
    diffuseColor: Color3.White(),
    emissiveColor: Color3.Black(),
  };

  public static DEBUG_DITHERING_ENABLED = false;

  /**
   * Force all the standard materials to compile to glsl even on WebGPU engines.
   * False by default. This is mostly meant for backward compatibility.
   */
  // public static ForceGLSL = false;

  /**
   * Defines the alpha limits in alpha test mode.
   */
  private static AlphaTestCutoff = 0.5;
  /**
   * Defines the maximum number of lights that can be used in the material
   */
  private static MaxSimultaneousLights: number = 4;


  /**
   * The color of the material lit by the environmental background lighting.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#ambient-color-example
   */
  // @TODO remove?
  private ambientColor = new Color3(0, 0, 0);

  /**
   * The basic color of the material as viewed under a light.
   */
  public _diffuseColor: Color3 | undefined = undefined;
  public get diffuseColor(): Color3 | undefined {
    if (this.overridesFromAsset.diffuseColor) return this.overridesFromAsset.diffuseColor;
    else if (this.overridesFromMaterial.diffuseColor) return this.overridesFromMaterial.diffuseColor;
    else return this._diffuseColor;
  }
  public set diffuseColor(value: Color3 | undefined) {
    this._diffuseColor = value;
  }
  /**
   * The basic texture of the material as viewed under a light.
   */
  private _diffuseTexture: BaseTexture | undefined = undefined;
  public get diffuseTexture(): BaseTexture | undefined {
    if (this.overridesFromAsset.diffuseTexture) return this.overridesFromAsset.diffuseTexture;
    else if (this.overridesFromMaterial.diffuseTexture) return this.overridesFromMaterial.diffuseTexture;
    else return this._diffuseTexture;
  }
  public set diffuseTexture(value: BaseTexture | undefined) {
    this._diffuseTexture = value;
    this.markAsDirty(Material.TextureDirtyFlag);
    void this.recalculateTransparencyMode();
  }

  /**
   * Recalculate whether the texture has transparency, based on the current `diffuseTexture`.
   */
  public async recalculateTransparencyMode(): Promise<void> {
    this.transparencyMode = Material.MATERIAL_OPAQUE;

    // Since transparency is based on diffuse texture, if there is no
    // diffuse texture defined on the material, then it is opaque by default
    if (this.diffuseTexture === undefined) {
      return;
    }

    // Ensure texture has loaded first
    if (!this.diffuseTexture.isReady()) {
      if (this.diffuseTexture instanceof Texture) {
        await new Promise((resolve, _reject) => {
          // @NOTE It doesn't seem like this can fail … ?
          (this.diffuseTexture as Texture).onLoadObservable.addOnce(resolve);
        });
      } else {
        // @TODO Could make the type of `DiffuseTexture` 'Texture'
        console.error(`[${RetroMaterial.name}}] (${this.recalculateTransparencyMode.name}) Could not wait for texture to be ready: Diffuse texture is not instance of 'Texture'`, this.diffuseTexture);
        return;
      }
    }

    /* Sanity check */
    if (!this.diffuseTexture.isReady()) {
      console.error(`[${RetroMaterial.name}] (${this.recalculateTransparencyMode.name}) (${this.name}) Couldn't recalculate texture transparency. Texture not-yet-ready: `, this.diffuseTexture);
      return;
    }

    // Read texture data into a buffer
    const textureSize = this.diffuseTexture.getSize();
    // @TODO Can't tell if this is naive - will all texture data return 4-byte RGBA data?
    const dataBuffer = new Uint8Array(textureSize.width * textureSize.height * 4/* @NOTE RGBA encoding */);
    /* Sanity check */
    if (dataBuffer.length === 0) {
      console.error(`[${RetroMaterial.name}] (${this.recalculateTransparencyMode.name}) (${this.name}) Couldn't recalculate texture transparency. Texture size is 0x0: `, this.diffuseTexture);
      return;
    }
    await this.diffuseTexture.readPixels(undefined, undefined, dataBuffer);

    // Iterate buffer until we find at least 1 pixel with alpha < 0xFF
    for (let i = 0; i < dataBuffer.length; i += 4) {
      if (dataBuffer[i + 3] < 0xFF) {
        console.log(`[DEBUG] [${RetroMaterial.name}] (${this.recalculateTransparencyMode.name}) Material '${this.name}' is transparent because its diffuse texture has at least 1 transparent pixel.`);
        this.transparencyMode = Material.MATERIAL_ALPHABLEND;
        return;
      }
    }
  }
  /**
   * Define the texture used to display the reflection.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
   */
  private _reflectionTexture: CubeTexture | undefined = undefined;
  public get reflectionTexture(): CubeTexture | undefined {
    if (this.overridesFromAsset.reflectionTexture) return this.overridesFromAsset.reflectionTexture;
    else if (this.overridesFromMaterial.reflectionTexture) return this.overridesFromMaterial.reflectionTexture;
    else return this._reflectionTexture;
  }
  public set reflectionTexture(value: CubeTexture | undefined) {
    this._reflectionTexture = value;
    this.markAsDirty(Material.TextureDirtyFlag);
  }
  /**
   * Define the color of the material as if self lit.
   * This will be mixed in the final result even in the absence of light.
   */
  private _emissionColor: Color3 | undefined = undefined;
  public get emissionColor(): Color3 | undefined {
    if (this.overridesFromAsset.emissionColor) return this.overridesFromAsset.emissionColor;
    else if (this.overridesFromMaterial.emissionColor) return this.overridesFromMaterial.emissionColor;
    else return this._emissionColor;
  }
  public set emissionColor(value: Color3 | undefined) {
    this._emissionColor = value;
  }

  /**
   * Does lights from the scene impacts this material.
   * It can be a nice trick for performance to disable lighting on a fully emissive material.
   */
  public disableLighting: boolean = false;

  /**
   * Material overrides from the assigned base material (.pzmat) override.
   * These materials take precedence over the asset's default imported material properties.
   * Asset-specific overrides take precedence over these.
   *
   * @example
   * ```markdown
   *  - `.mtl` file specifies the diffuse texture as `dirt.png`
   *  - Base material override (`.pzmat`) specifies diffuse texture as `metal.png`
   *  - Asset override specifies diffuse texture as `grass.png`
   *
   * Result: `grass.png`
   * ```
   *
   * @example
   * ```markdown
   *  - `.mtl` file specifies the diffuse texture as `dirt.png`
   *  - Base material override (`.pzmat`) specifies diffuse texture as `metal.png`
   *  - Asset override does not specify a diffuse texture
   *
   * Result: `metal.png`
   * ```
   */
  public readonly overridesFromMaterial = new RetroMaterialOverrides(this);
  public readOverridesFromMaterial(material: MaterialAsset | undefined): void {
    if (material) {
      this.overridesFromMaterial.diffuseColor = material.diffuseColor;
      this.overridesFromMaterial.diffuseTexture = material.diffuseTexture;
      this.overridesFromMaterial.emissionColor = material.emissionColor;
      this.overridesFromMaterial.reflectionTexture = material.reflectionTexture;
    } else {
      this.overridesFromMaterial.diffuseColor = undefined;
      this.overridesFromMaterial.diffuseTexture = undefined;
      this.overridesFromMaterial.emissionColor = undefined;
      this.overridesFromMaterial.reflectionTexture = undefined;
    }
  }
  /**
   * Material overrides specific to the asset.
   * These take precedence over the base material overrides, as well as the asset's default imported material properties.
   *
   * @example
   * ```markdown
   *  - `.mtl` file specifies the diffuse texture as `dirt.png`
   *  - Base material override (`.pzmat`) specifies diffuse texture as `metal.png`
   *  - Asset override specifies diffuse texture as `grass.png`
   *
   * Result: `grass.png`
   * ```
   *
   * @example
   * ```markdown
   *  - `.mtl` file specifies the diffuse texture as `dirt.png`
   *  - Base material override (`.pzmat`) specifies diffuse texture as `metal.png`
   *  - Asset override does not specify a diffuse texture
   *
   * Result: `metal.png`
   * ```
   */
  public readonly overridesFromAsset = new RetroMaterialOverrides(this);

  // /**
  //  * AKA Occlusion Texture in other nomenclature, it helps adding baked shadows into your material.
  //  */
  // public ambientTexture: Nullable<BaseTexture> = null;

  // /**
  //  * Define the transparency of the material from a texture.
  //  * The final alpha value can be read either from the red channel (if texture.getAlphaFromRGB is false)
  //  * or from the luminance or the current texel (if texture.getAlphaFromRGB is true)
  //  */
  // public opacityTexture: Nullable<BaseTexture> = null;



  // /**
  //  * Define texture of the material as if self lit.
  //  * This will be mixed in the final result even in the absence of light.
  //  */
  // public emissiveTexture: Nullable<BaseTexture> = null;

  // /**
  //  * Define how the color and intensity of the highlight given by the light in the material.
  //  */
  // public specularTexture: Nullable<BaseTexture> = null;

  // /**
  //  * Bump mapping is a technique to simulate bump and dents on a rendered surface.
  //  * These are made by creating a normal map from an image. The means to do this can be found on the web, a search for 'normal map generator' will bring up free and paid for methods of doing this.
  //  * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials#bump-map
  //  */
  // public bumpTexture: Nullable<BaseTexture> = null;

  // /**
  //  * Complex lighting can be computationally expensive to compute at runtime.
  //  * To save on computation, lightmaps may be used to store calculated lighting in a texture which will be applied to a given mesh.
  //  * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction#lightmaps
  //  */
  // public lightmapTexture: Nullable<BaseTexture> = null;

  // /**
  //  * Define the texture used to display the refraction.
  //  * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
  //  */
  // public refractionTexture: Nullable<BaseTexture> = null;





  // /**
  //  * Define how the color and intensity of the highlight given by the light in the material.
  //  */
  // public specularColor = new Color3(1, 1, 1);



  // /**
  //  * Defines how sharp are the highlights in the material.
  //  * The bigger the value the sharper giving a more glossy feeling to the result.
  //  * Reversely, the smaller the value the blurrier giving a more rough feeling to the result.
  //  */
  // public specularPower = 64;

  /**
   * Does the transparency come from the diffuse texture alpha channel.
   */
  // public useAlphaFromDiffuseTexture: boolean = false;

  /**
   * If true, the emissive value is added into the end result, otherwise it is multiplied in.
   */
  // public useEmissiveAsIllumination: boolean = true;

  // /**
  //  * If true, some kind of energy conservation will prevent the end result to be more than 1 by reducing
  //  * the emissive level when the final color is close to one.
  //  */
  // public linkEmissiveWithDiffuse: boolean = false;

  /**
   * Specifies that the material will keep the specular highlights over a transparent surface (only the most luminous ones).
   * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
   */
  // public useSpecularOverAlpha: boolean = false;

  /**
   * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most luminous ones).
   * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
   */
  // public useReflectionOverAlpha: boolean = false;



  /**
   * Allows using an object space normal map (instead of tangent space).
   */
  // public useObjectSpaceNormalMap: boolean = false;

  /**
   * Is parallax enabled or not.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/parallaxMapping
   */
  // public useParallax: boolean = false;

  /**
   * Is parallax occlusion enabled or not.
   * If true, the outcome is way more realistic than traditional Parallax but you can expect a performance hit that worthes consideration.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/parallaxMapping
   */
  // public useParallaxOcclusion: boolean = false;

  /**
   * Apply a scaling factor that determine which "depth" the height map should reprensent. A value between 0.05 and 0.1 is reasonnable in Parallax, you can reach 0.2 using Parallax Occlusion.
   */
  // public parallaxScaleBias = 0.05;

  /**
   * Helps to define how blurry the reflections should appears in the material.
   */
  // public roughness: number = 0;

  /**
   * In case of refraction, define the value of the index of refraction.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
   */
  // public indexOfRefraction = 0.98;

  /**
   * Invert the refraction texture alongside the y axis.
   * It can be useful with procedural textures or probe for instance.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
   */
  // public invertRefractionY = true;

  /**
   * In case of light mapping, define whether the map contains light or shadow informations.
   */
  // public useLightmapAsShadowmap: boolean = false;

  // Fresnel
  /**
   * Define the diffuse fresnel parameters of the material.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
   */
  // public diffuseFresnelParameters: FresnelParameters = undefined!;

  /**
   * Define the opacity fresnel parameters of the material.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
   */
  // public opacityFresnelParameters: FresnelParameters = undefined!;

  /**
   * Define the reflection fresnel parameters of the material.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
   */
  // public reflectionFresnelParameters: FresnelParameters = undefined!;

  /**
   * Define the refraction fresnel parameters of the material.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
   */
  // public refractionFresnelParameters: FresnelParameters = undefined!;

  /**
   * Define the emissive fresnel parameters of the material.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
   */
  // public emissiveFresnelParameters: FresnelParameters = undefined!;

  /**
   * If true automatically deducts the fresnels values from the material specularity.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
   */
  // public useReflectionFresnelFromSpecular: boolean = false;

  /**
   * Defines if the glossiness/roughness of the material should be read from the specular map alpha channel
   */
  // public useGlossinessFromSpecularMapAlpha: boolean = false;

  /**
   * If sets to true, x component of normal map value will invert (x = 1.0 - x).
   */
  // public invertNormalMapX: boolean = false;

  /**
   * If sets to true, y component of normal map value will invert (y = 1.0 - y).
   */
  // public invertNormalMapY: boolean = false;

  /**
   * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
   */
  // public twoSidedLighting: boolean = false;

  /**
   * If sets to true, the decal map will be applied after the detail map. Else, it is applied before (default: false)
   */
  // public applyDecalMapAfterDetailMap: boolean = false;

  /**
   * Default configuration related to image processing available in the standard Material.
   */
  // protected _imageProcessingConfiguration: ImageProcessingConfiguration = undefined!;

  /**
   * Gets the image processing configuration used either in this material.
   */
  // public get imageProcessingConfiguration(): ImageProcessingConfiguration {
  //   return this._imageProcessingConfiguration;
  // }

  // /**
  //  * Sets the Default image processing configuration used either in the this material.
  //  *
  //  * If sets to null, the scene one is in use.
  //  */
  // public set imageProcessingConfiguration(value: ImageProcessingConfiguration) {
  //   this._attachImageProcessingConfiguration(value);

  //   // Ensure the effect will be rebuilt.
  //   this._markAllSubMeshesAsTexturesDirty();
  // }

  /**
   * Keep track of the image processing observer to allow dispose and replace.
   */
  // private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>> = null;

  /**
   * Attaches a new image processing configuration to the Standard Material.
   * @param configuration
   */
  // protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void {
  //   if (configuration === this._imageProcessingConfiguration) {
  //     return;
  //   }

  //   // Detaches observer
  //   if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
  //     this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
  //   }

  //   // Pick the scene configuration if needed
  //   if (!configuration) {
  //     this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
  //   } else {
  //     this._imageProcessingConfiguration = configuration;
  //   }

  //   // Attaches observer
  //   if (this._imageProcessingConfiguration) {
  //     this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
  //       this._markAllSubMeshesAsImageProcessingDirty();
  //     });
  //   }
  // }

  /**
   * Defines additional PrePass parameters for the material.
   */
  // public readonly prePassConfiguration: PrePassConfiguration;

  /**
   * Can this material render to prepass
   */
  // public override get isPrePassCapable(): boolean {
  //   return !this.disableDepthWrite;
  // }

  /**
   * Gets whether the color curves effect is enabled.
   */
  // public get cameraColorCurvesEnabled(): boolean {
  //   return this.imageProcessingConfiguration.colorCurvesEnabled;
  // }
  /**
   * Sets whether the color curves effect is enabled.
   */
  // public set cameraColorCurvesEnabled(value: boolean) {
  //   this.imageProcessingConfiguration.colorCurvesEnabled = value;
  // }

  /**
   * Gets whether the color grading effect is enabled.
   */
  // public get cameraColorGradingEnabled(): boolean {
  //   return this.imageProcessingConfiguration.colorGradingEnabled;
  // }
  /**
   * Gets whether the color grading effect is enabled.
   */
  // public set cameraColorGradingEnabled(value: boolean) {
  //   this.imageProcessingConfiguration.colorGradingEnabled = value;
  // }

  /**
   * Gets whether tonemapping is enabled or not.
   */
  // public get cameraToneMappingEnabled(): boolean {
  //   return this._imageProcessingConfiguration.toneMappingEnabled;
  // }
  /**
   * Sets whether tonemapping is enabled or not
   */
  // public set cameraToneMappingEnabled(value: boolean) {
  //   this._imageProcessingConfiguration.toneMappingEnabled = value;
  // }

  /**
   * The camera exposure used on this material.
   * This property is here and not in the camera to allow controlling exposure without full screen post process.
   * This corresponds to a photographic exposure.
   */
  // public get cameraExposure(): number {
  //   return this._imageProcessingConfiguration.exposure;
  // }
  /**
   * The camera exposure used on this material.
   * This property is here and not in the camera to allow controlling exposure without full screen post process.
   * This corresponds to a photographic exposure.
   */
  // public set cameraExposure(value: number) {
  //   this._imageProcessingConfiguration.exposure = value;
  // }

  /**
   * Gets The camera contrast used on this material.
   */
  // public get cameraContrast(): number {
  //   return this._imageProcessingConfiguration.contrast;
  // }

  /**
   * Sets The camera contrast used on this material.
   */
  // public set cameraContrast(value: number) {
  //   this._imageProcessingConfiguration.contrast = value;
  // }

  /**
   * Gets the Color Grading 2D Lookup Texture.
   */
  // public get cameraColorGradingTexture(): Nullable<BaseTexture> {
  //   return this._imageProcessingConfiguration.colorGradingTexture;
  // }
  /**
   * Sets the Color Grading 2D Lookup Texture.
   */
  // public set cameraColorGradingTexture(value: Nullable<BaseTexture>) {
  //   this._imageProcessingConfiguration.colorGradingTexture = value;
  // }

  /**
   * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
   * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
   * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
   * corresponding to low luminance, medium luminance, and high luminance areas respectively.
   */
  // public get cameraColorCurves(): Nullable<ColorCurves> {
  //   return this._imageProcessingConfiguration.colorCurves;
  // }
  /**
   * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
   * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
   * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
   * corresponding to low luminance, medium luminance, and high luminance areas respectively.
   */
  // public set cameraColorCurves(value: Nullable<ColorCurves>) {
  //   this._imageProcessingConfiguration.colorCurves = value;
  // }

  /**
   * Can this material render to several textures at once
   */
  // public override get canRenderToMRT(): boolean {
  //   return true;
  // }

  /**
   * Defines the detail map parameters for the material.
   */
  // public readonly detailMap: DetailMapConfiguration;

  // protected _renderTargets = new SmartArray<RenderTargetTexture>(16);
  // protected _globalAmbientColor = new Color3(0, 0, 0);
  // protected _cacheHasRenderTargetTextures = false;

  /**
   * Instantiates a new standard material.
   * This is the default material used in Babylon. It is the best trade off between quality
   * and performances.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
   * @param name Define the name of the material in the scene
   * @param scene Define the scene the material belong to
  //  * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
   */
  constructor(name: string, scene?: Scene/* , forceGLSL = false */) {
    super(name, scene, undefined /*, forceGLSL || RetroMaterial.ForceGLSL */);

    // this.detailMap = new DetailMapConfiguration(this as unknown as StandardMaterial);

    // Setup the default processing configuration to the scene.
    // this._attachImageProcessingConfiguration(null);
    // this.prePassConfiguration = new PrePassConfiguration();

    // this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
    //   this._renderTargets.reset();

    //   if (RetroMaterial.ReflectionTextureEnabled && this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
    //     this._renderTargets.push(<RenderTargetTexture>this.reflectionTexture);
    //   }

    //   if (RetroMaterial.RefractionTextureEnabled && this.refractionTexture && this.refractionTexture.isRenderTarget) {
    //     this._renderTargets.push(<RenderTargetTexture>this.refractionTexture);
    //   }

    //   this._eventInfo.renderTargets = this._renderTargets;
    //   this._callbackPluginEventFillRenderTargetTextures(this._eventInfo);

    //   return this._renderTargets;
    // };
  }

  /**
   * Gets a boolean indicating that current material needs to register RTT
   */
  // public override get hasRenderTargetTextures(): boolean {
  //   if (RetroMaterial.ReflectionTextureEnabled && this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
  //     return true;
  //   }

  //   if (RetroMaterial.RefractionTextureEnabled && this.refractionTexture && this.refractionTexture.isRenderTarget) {
  //     return true;
  //   }

  //   return this._cacheHasRenderTargetTextures;
  // }

  /**
   * Gets the current class name of the material e.g. "RetroMaterial"
   * Mainly use in serialization.
   * @returns the class name
   */
  // public override getClassName(): string {
  //   return "RetroMaterial";
  // }

  // /**
  //  * Specifies if the material will require alpha blending
  //  * @returns a boolean specifying if alpha blending is needed
  //  */
  // public override needAlphaBlending(): boolean {
  //   if (this._hasTransparencyMode) {
  //     return this._transparencyModeIsBlend;
  //   }

  //   if (this._disableAlphaBlending) {
  //     return false;
  //   }

  //   return (
  //     this.alpha < 1.0 ||
  //     // this.opacityTexture != null ||
  //     this._shouldUseAlphaFromDiffuseTexture()// ||
  //     // (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled)
  //   );
  // }

  /**
   * Specifies if this material should be rendered in alpha test mode
   * @returns a boolean specifying if an alpha test is needed.
   */
  // public override needAlphaTesting(): boolean {
  //   if (this._hasTransparencyMode) {
  //     return this._transparencyModeIsTest;
  //   }

  //   return this._hasAlphaChannel() && (this._transparencyMode == null || this._transparencyMode === Material.MATERIAL_ALPHATEST);
  // }

  /**
   * @returns whether or not the alpha value of the diffuse texture should be used for alpha blending.
   */
  // protected _shouldUseAlphaFromDiffuseTexture(): boolean {
  //   return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && /* this.useAlphaFromDiffuseTexture && */ this._transparencyMode !== Material.MATERIAL_OPAQUE;
  // }

  /**
   * @returns whether or not there is a usable alpha channel for transparency.
   */
  // protected _hasAlphaChannel(): boolean {
  //   return (this.diffuseTexture != null && this.diffuseTexture.hasAlpha) || this.opacityTexture != null;
  // }

  /**
   * Get the texture used for alpha test purpose.
   * @returns the diffuse texture in case of the standard material.
   */
  // public override getAlphaTestTexture(): Nullable<BaseTexture> {
  //   return this.diffuseTexture;
  // }

  /**
   * Get if the submesh is ready to be used and all its information available.
   * Child classes can use it to update shaders
   * @param mesh defines the mesh to check
   * @param subMesh defines which submesh to check
   * @param useInstances specifies that instances should be used
   * @returns a boolean indicating that the submesh is ready or not
   */
  public override isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean {
    if (!this._uniformBufferLayoutBuilt) {
      this.buildUniformLayout();
    }

    const drawWrapper = subMesh._drawWrapper;

    if (drawWrapper.effect && this.isFrozen) {
      if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
        return true;
      }
    }

    if (!subMesh.materialDefines) {
      this._callbackPluginEventGeneric(MaterialPluginEvent.GetDefineNames, this._eventInfo);
      subMesh.materialDefines = new RetroMaterialDefines(this._eventInfo.defineNames);
    }

    const scene = this.getScene();
    const defines = subMesh.materialDefines as RetroMaterialDefines;
    if (this._isReadyForSubMesh(subMesh)) {
      return true;
    }

    const engine = scene.getEngine();

    // @DEBUG Dithering, just vibes for now
    defines.DITHER = RetroMaterial.DEBUG_DITHERING_ENABLED;

    // Lights
    defines._needNormals = PrepareDefinesForLights(scene, mesh, defines, false, RetroMaterial.MaxSimultaneousLights, this.disableLighting);

    // Multiview
    // PrepareDefinesForMultiview(scene, defines);

    // PrePass
    // const oit = this.needAlphaBlendingForMesh(mesh) && this.getScene().useOrderIndependentTransparency;
    // PrepareDefinesForPrePass(scene, defines, this.canRenderToMRT && !oit);

    // Order independant transparency
    // PrepareDefinesForOIT(scene, defines, oit);

    MaterialHelperGeometryRendering.PrepareDefines(engine.currentRenderPassId, mesh, defines);

    // Textures
    if (defines._areTexturesDirty) {
      // this._eventInfo.hasRenderTargetTextures = false;
      // this._callbackPluginEventHasRenderTargetTextures(this._eventInfo);
      // this._cacheHasRenderTargetTextures = this._eventInfo.hasRenderTargetTextures;
      defines._needUVs = false;
      // for (let i = 1; i <= Constants.MAX_SUPPORTED_UV_SETS; ++i) {
      //   defines["MAINUV" + i] = false;
      // }
      if (scene.texturesEnabled) {
        defines.DIFFUSEDIRECTUV = 0;
        // defines.BUMPDIRECTUV = 0;
        // defines.AMBIENTDIRECTUV = 0;
        // defines.OPACITYDIRECTUV = 0;
        // defines.EMISSIVEDIRECTUV = 0;
        // defines.SPECULARDIRECTUV = 0;
        // defines.LIGHTMAPDIRECTUV = 0;

        if (this.diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
          if (!this.diffuseTexture.isReadyOrNotBlocking()) {
            return false;
          } else {
            PrepareDefinesForMergedUV(this.diffuseTexture, defines, "DIFFUSE");
          }
        } else {
          defines.DIFFUSE = false;
        }

        // if (this.ambientTexture && RetroMaterial.AmbientTextureEnabled) {
        //   if (!this.ambientTexture.isReadyOrNotBlocking()) {
        //     return false;
        //   } else {
        //     PrepareDefinesForMergedUV(this.ambientTexture, defines, "AMBIENT");
        //   }
        // } else {
        //   defines.AMBIENT = false;
        // }

        // if (this.opacityTexture && RetroMaterial.OpacityTextureEnabled) {
        //   if (!this.opacityTexture.isReadyOrNotBlocking()) {
        //     return false;
        //   } else {
        //     PrepareDefinesForMergedUV(this.opacityTexture, defines, "OPACITY");
        //     defines.OPACITYRGB = this.opacityTexture.getAlphaFromRGB;
        //   }
        // } else {
        //   defines.OPACITY = false;
        // }

        // @TODO Simplify after implement cubemaps
        if (this.reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
          if (!this.reflectionTexture.isReadyOrNotBlocking()) {
            return false;
          } else {
            defines._needNormals = true;
            defines.REFLECTION = true;

            // defines.ROUGHNESS = this.roughness > 0;
            // @TODO Bring this back?
            // defines.REFLECTIONOVERALPHA = this.useReflectionOverAlpha;

            defines.INVERTCUBICMAP = this.reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE;
            defines.REFLECTIONMAP_3D = this.reflectionTexture.isCube;
            // defines.REFLECTIONMAP_OPPOSITEZ = defines.REFLECTIONMAP_3D &&
            //   this.getScene().useRightHandedSystem
            //   ? !this.reflectionTexture.invertZ
            //   : this.reflectionTexture.invertZ;
            // defines.RGBDREFLECTION = this.reflectionTexture.isRGBD;

            switch (this.reflectionTexture.coordinatesMode) {
              case Texture.EXPLICIT_MODE:
                defines.setReflectionMode("REFLECTIONMAP_EXPLICIT");
                break;
              case Texture.PLANAR_MODE:
                defines.setReflectionMode("REFLECTIONMAP_PLANAR");
                break;
              case Texture.PROJECTION_MODE:
                defines.setReflectionMode("REFLECTIONMAP_PROJECTION");
                break;
              case Texture.SKYBOX_MODE:
                defines.setReflectionMode("REFLECTIONMAP_SKYBOX");
                break;
              case Texture.SPHERICAL_MODE:
                defines.setReflectionMode("REFLECTIONMAP_SPHERICAL");
                break;
              case Texture.EQUIRECTANGULAR_MODE:
                defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR");
                break;
              case Texture.FIXED_EQUIRECTANGULAR_MODE:
                defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
                break;
              case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                defines.setReflectionMode("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
                break;
              case Texture.CUBIC_MODE:
              case Texture.INVCUBIC_MODE:
              default:
                defines.setReflectionMode("REFLECTIONMAP_CUBIC");
                break;
            }

            defines.USE_LOCAL_REFLECTIONMAP_CUBIC = this.reflectionTexture instanceof CubeTexture && this.reflectionTexture.boundingBoxSize ? true : false;
          }
        } else {
          defines.REFLECTION = false;
          defines.REFLECTIONMAP_OPPOSITEZ = false;
        }

        // if (this.emissiveTexture && RetroMaterial.EmissiveTextureEnabled) {
        //   if (!this.emissiveTexture.isReadyOrNotBlocking()) {
        //     return false;
        //   } else {
        //     PrepareDefinesForMergedUV(this.emissiveTexture, defines, "EMISSIVE");
        //   }
        // } else {
        //   defines.EMISSIVE = false;
        // }

        // if (this.lightmapTexture && RetroMaterial.LightmapTextureEnabled) {
        //   if (!this.lightmapTexture.isReadyOrNotBlocking()) {
        //     return false;
        //   } else {
        //     PrepareDefinesForMergedUV(this.lightmapTexture, defines, "LIGHTMAP");
        //     defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
        //     defines.RGBDLIGHTMAP = this.lightmapTexture.isRGBD;
        //   }
        // } else {
        //   defines.LIGHTMAP = false;
        // }

        // if (this.specularTexture && RetroMaterial.SpecularTextureEnabled) {
        //   if (!this.specularTexture.isReadyOrNotBlocking()) {
        //     return false;
        //   } else {
        //     PrepareDefinesForMergedUV(this.specularTexture, defines, "SPECULAR");
        //     defines.GLOSSINESS = this.useGlossinessFromSpecularMapAlpha;
        //   }
        // } else {
        //   defines.SPECULAR = false;
        // }

        // if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && RetroMaterial.BumpTextureEnabled) {
        //   // Bump texture can not be not blocking.
        //   if (!this.bumpTexture.isReady()) {
        //     return false;
        //   } else {
        //     PrepareDefinesForMergedUV(this.bumpTexture, defines, "BUMP");

        //     defines.PARALLAX = this.useParallax;
        //     defines.PARALLAX_RHS = scene.useRightHandedSystem;
        //     defines.PARALLAXOCCLUSION = this.useParallaxOcclusion;
        //   }

        //   defines.OBJECTSPACE_NORMALMAP = this.useObjectSpaceNormalMap;
        // } else {
        //   defines.BUMP = false;
        //   defines.PARALLAX = false;
        //   defines.PARALLAX_RHS = false;
        //   defines.PARALLAXOCCLUSION = false;
        // }

        // if (this.refractionTexture && RetroMaterial.RefractionTextureEnabled) {
        //   if (!this.refractionTexture.isReadyOrNotBlocking()) {
        //     return false;
        //   } else {
        //     defines._needUVs = true;
        //     defines.REFRACTION = true;

        //     defines.REFRACTIONMAP_3D = this.refractionTexture.isCube;
        //     defines.RGBDREFRACTION = this.refractionTexture.isRGBD;
        //     defines.USE_LOCAL_REFRACTIONMAP_CUBIC = (<any>this.refractionTexture).boundingBoxSize ? true : false;
        //   }
        // } else {
        //   defines.REFRACTION = false;
        // }

        // defines.TWOSIDEDLIGHTING = !this._backFaceCulling && this.twoSidedLighting;
      } else {
        defines.DIFFUSE = false;
        // defines.AMBIENT = false;
        // defines.OPACITY = false;
        defines.REFLECTION = false;
        // defines.EMISSIVE = false;
        // defines.LIGHTMAP = false;
        // defines.BUMP = false;
        // defines.REFRACTION = false;
      }

      // defines.ALPHAFROMDIFFUSE = this._shouldUseAlphaFromDiffuseTexture();
      defines.ALPHAFROMDIFFUSE = true; // this.diffuseTexture?.hasAlpha || false;

      // defines.EMISSIVEASILLUMINATION = this.useEmissiveAsIllumination; // @TODO is true
      // @NOTE Emission is custom now - these settings are obsolete
      // defines.EMISSIVEASILLUMINATION = true; // @TODO how does emmission work?
      // defines.LINKEMISSIVEWITHDIFFUSE = false; // @TODO what does this do in code?

      // defines.SPECULAROVERALPHA = this.useSpecularOverAlpha;

      defines.PREMULTIPLYALPHA = this.alphaMode === Constants.ALPHA_PREMULTIPLIED || this.alphaMode === Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;

      defines.ALPHATEST_AFTERALLALPHACOMPUTATIONS = this.transparencyMode !== null;

      defines.ALPHABLEND = this.needAlphaBlendingForMesh(mesh);
    }

    this._eventInfo.isReadyForSubMesh = true;
    this._eventInfo.defines = defines;
    this._eventInfo.subMesh = subMesh;
    this._callbackPluginEventIsReadyForSubMesh(this._eventInfo);

    if (!this._eventInfo.isReadyForSubMesh) {
      return false;
    }

    // if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
    //   if (!this._imageProcessingConfiguration.isReady()) {
    //     return false;
    //   }

    //   this._imageProcessingConfiguration.prepareDefines(defines);

    //   defines.IS_REFLECTION_LINEAR = this.reflectionTexture != null && !this.reflectionTexture.gammaSpace;
    //   defines.IS_REFRACTION_LINEAR = this.refractionTexture != null && !this.refractionTexture.gammaSpace;
    // }

    // if (defines._areFresnelDirty) {
    //   if (RetroMaterial.FresnelEnabled) {
    //     // Fresnel
    //     if (
    //       this.diffuseFresnelParameters ||
    //       this.opacityFresnelParameters ||
    //       this.emissiveFresnelParameters ||
    //       this.refractionFresnelParameters ||
    //       this.reflectionFresnelParameters
    //     ) {
    //       defines.DIFFUSEFRESNEL = this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled;

    //       defines.OPACITYFRESNEL = this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;

    //       defines.REFLECTIONFRESNEL = this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled;

    //       defines.REFLECTIONFRESNELFROMSPECULAR = this.useReflectionFresnelFromSpecular;

    //       defines.REFRACTIONFRESNEL = this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled;

    //       defines.EMISSIVEFRESNEL = this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled;

    //       defines._needNormals = true;
    //       defines.FRESNEL = true;
    //     }
    //   } else {
    //     defines.FRESNEL = false;
    //   }
    // }

    // // Check if Area Lights have LTC texture.
    // if (defines["AREALIGHTUSED"]) {
    //   for (let index = 0; index < mesh.lightSources.length; index++) {
    //     if (!mesh.lightSources[index]._isReady()) {
    //       return false;
    //     }
    //   }
    // }

    // Misc.
    PrepareDefinesForMisc(
      mesh,
      scene,
      this._useLogarithmicDepth,
      this.pointsCloud,
      this.fogEnabled,
      this.needAlphaTestingForMesh(mesh),
      defines,
      false, // this.applyDecalMapAfterDetailMap,
    );

    // Values that need to be evaluated on every frame
    PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);

    // External config
    this._eventInfo.defines = defines;
    this._eventInfo.mesh = mesh;
    this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo);

    // Attribs
    PrepareDefinesForAttributes(mesh, defines, true, true, true);

    // External config
    this._callbackPluginEventPrepareDefines(this._eventInfo);

    // Get correct effect
    let forceWasNotReadyPreviously = false;

    if (defines.isDirty) {
      const lightDisposed = defines._areLightsDisposed;
      defines.markAsProcessed();

      // Fallbacks
      const fallbacks = new EffectFallbacks();
      // if (defines.REFLECTION) {
      //   fallbacks.addFallback(0, "REFLECTION");
      // }

      // if (defines.SPECULAR) {
      //   fallbacks.addFallback(0, "SPECULAR");
      // }

      // if (defines.BUMP) {
      //   fallbacks.addFallback(0, "BUMP");
      // }

      // if (defines.PARALLAX) {
      //   fallbacks.addFallback(1, "PARALLAX");
      // }

      // if (defines.PARALLAX_RHS) {
      //   fallbacks.addFallback(1, "PARALLAX_RHS");
      // }

      // if (defines.PARALLAXOCCLUSION) {
      //   fallbacks.addFallback(0, "PARALLAXOCCLUSION");
      // }

      // if (defines.SPECULAROVERALPHA) {
      //   fallbacks.addFallback(0, "SPECULAROVERALPHA");
      // }

      if (defines.FOG) {
        fallbacks.addFallback(1, "FOG");
      }

      // if (defines.POINTSIZE) {
      //   fallbacks.addFallback(0, "POINTSIZE");
      // }

      if (defines.LOGARITHMICDEPTH) {
        fallbacks.addFallback(0, "LOGARITHMICDEPTH");
      }

      HandleFallbacksForShadows(defines, fallbacks, RetroMaterial.MaxSimultaneousLights);

      // if (defines.SPECULARTERM) {
      //   fallbacks.addFallback(0, "SPECULARTERM");
      // }

      // if (defines.DIFFUSEFRESNEL) {
      //   fallbacks.addFallback(1, "DIFFUSEFRESNEL");
      // }

      // if (defines.OPACITYFRESNEL) {
      //   fallbacks.addFallback(2, "OPACITYFRESNEL");
      // }

      // if (defines.REFLECTIONFRESNEL) {
      // fallbacks.addFallback(3, "REFLECTIONFRESNEL");
      // }

      // if (defines.EMISSIVEFRESNEL) {
      //   fallbacks.addFallback(4, "EMISSIVEFRESNEL");
      // }

      // if (defines.FRESNEL) {
      //   fallbacks.addFallback(4, "FRESNEL");
      // }

      // if (defines.MULTIVIEW) {
      //   fallbacks.addFallback(0, "MULTIVIEW");
      // }

      //Attributes
      const attribs = [VertexBuffer.PositionKind];

      // @TODO needed?
      if (defines.NORMAL) {
        attribs.push(VertexBuffer.NormalKind);
      }

      if (defines.TANGENT) {
        attribs.push(VertexBuffer.TangentKind);
      }

      for (let i = 1; i <= Constants.MAX_SUPPORTED_UV_SETS; ++i) {
        if (defines["UV" + i]) {
          attribs.push(`uv${i === 1 ? "" : i}`);
        }
      }

      if (defines.VERTEXCOLOR) {
        attribs.push(VertexBuffer.ColorKind);
      }

      PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
      PrepareAttributesForInstances(attribs, defines);
      PrepareAttributesForMorphTargets(attribs, mesh, defines);
      PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines);

      // let shaderName = "default";

      const uniforms = [
        "world",
        "view",
        "viewProjection",
        "vEyePosition",
        "vLightsType",
        "vAmbientColor",
        "vDiffuseColor",
        // "vSpecularColor",
        "vEmissiveColor",
        "visibility",
        "vFogInfos",
        "vFogColor",
        // "pointSize",
        "vDiffuseInfos",
        // "vAmbientInfos",
        // "vOpacityInfos",
        "vReflectionInfos",
        // "vEmissiveInfos",
        // "vSpecularInfos",
        // "vBumpInfos",
        // "vLightmapInfos",
        // "vRefractionInfos",
        "mBones",
        "diffuseMatrix",
        // "ambientMatrix",
        // "opacityMatrix",
        "reflectionMatrix",
        // "emissiveMatrix",
        // "specularMatrix",
        // "bumpMatrix",
        // "normalMatrix",
        // "lightmapMatrix",
        // "refractionMatrix",
        // "diffuseLeftColor",
        // "diffuseRightColor",
        // "opacityParts",
        // "reflectionLeftColor",
        // "reflectionRightColor",
        // "emissiveLeftColor",
        // "emissiveRightColor",
        // "refractionLeftColor",
        // "refractionRightColor",
        "vReflectionPosition",
        "vReflectionSize",
        // "vRefractionPosition",
        // "vRefractionSize",
        "logarithmicDepthConstant",
        // "vTangentSpaceParams",
        "alphaCutOff",
        "boneTextureWidth",
        "morphTargetTextureInfo",
        "morphTargetTextureIndices",
      ];

      const samplers = [
        "diffuseSampler",
        // "ambientSampler",
        // "opacitySampler",
        "reflectionCubeSampler",
        "reflection2DSampler",
        // "emissiveSampler",
        // "specularSampler",
        // "bumpSampler",
        // "lightmapSampler",
        // "refractionCubeSampler",
        // "refraction2DSampler",
        "boneSampler",
        "morphTargets",
        "oitDepthSampler",
        "oitFrontColorSampler",
        // "areaLightsLTC1Sampler",
        // "areaLightsLTC2Sampler",
      ];

      const uniformBuffers = ["Material", "Scene", "Mesh"];

      const indexParameters = { maxSimultaneousLights: RetroMaterial.MaxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS };

      this._eventInfo.fallbacks = fallbacks;
      this._eventInfo.fallbackRank = 0;
      this._eventInfo.defines = defines;
      this._eventInfo.uniforms = uniforms;
      this._eventInfo.attributes = attribs;
      this._eventInfo.samplers = samplers;
      this._eventInfo.uniformBuffersNames = uniformBuffers;
      // this._eventInfo.customCode = undefined;
      this._eventInfo.mesh = mesh;
      this._eventInfo.indexParameters = indexParameters;
      this._callbackPluginEventGeneric(MaterialPluginEvent.PrepareEffect, this._eventInfo);

      MaterialHelperGeometryRendering.AddUniformsAndSamplers(uniforms, samplers);

      // PrePassConfiguration.AddUniforms(uniforms);
      // PrePassConfiguration.AddSamplers(samplers);

      // if (ImageProcessingConfiguration) {
      //   ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
      //   ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
      // }

      PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
        uniformsNames: uniforms,
        uniformBuffersNames: uniformBuffers,
        samplers: samplers,
        defines: defines,
        maxSimultaneousLights: RetroMaterial.MaxSimultaneousLights,
      });

      AddClipPlaneUniforms(uniforms);

      // const csnrOptions: ICustomShaderNameResolveOptions = {};

      // if (this.customShaderNameResolve) {
      //     shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines, attribs, csnrOptions);
      // }

      const join = defines.toString();

      const previousEffect = subMesh.effect;
      let effect = scene.getEngine().createEffect(
        {
          vertexSource: MasterVertexShaderSource,
          fragmentSource: MasterFragmentShaderSource,
        } satisfies IShaderPath,
        {
          attributes: attribs,
          uniformsNames: uniforms,
          uniformBuffersNames: uniformBuffers,
          samplers: samplers,
          defines: join,
          fallbacks: fallbacks,
          onCompiled: this.onCompiled,
          onError: this.onError,
          indexParameters,
          // processFinalCode: csnrOptions.processFinalCode,
          processFinalCode: (type, code, _defines) => {
            // console.log(`[${this.name}] (processFinalCode) (type='${type}')`, code);
            return code;
          },
          multiTarget: defines.PREPASS,
          shaderLanguage: this._shaderLanguage,
        } satisfies IEffectCreationOptions,
        engine,
      );


      if (effect) {
        if (this._onEffectCreatedObservable) {
          // onCreatedEffectParameters.effect = effect;
          // onCreatedEffectParameters.subMesh = subMesh;
          this._onEffectCreatedObservable.notifyObservers({
            effect,
            subMesh,
          });
        }

        // Use previous effect while new one is compiling
        if (this.allowShaderHotSwapping && previousEffect && !effect.isReady()) {
          effect = previousEffect;
          defines.markAsUnprocessed();

          forceWasNotReadyPreviously = this.isFrozen;

          if (lightDisposed) {
            // re register in case it takes more than one frame.
            defines._areLightsDisposed = true;
            return false;
          }
        } else {
          scene.resetCachedMaterial();
          subMesh.setEffect(effect, defines, this._materialContext);
        }
      }
    }

    if (!subMesh.effect || !subMesh.effect.isReady()) {
      return false;
    }

    defines._renderId = scene.getRenderId();
    drawWrapper._wasPreviouslyReady = forceWasNotReadyPreviously ? false : true;
    drawWrapper._wasPreviouslyUsingInstances = useInstances;

    this._checkScenePerformancePriority();

    return true;
  }

  /**
   * Builds the material UBO layouts.
   * Used internally during the effect preparation.
   */
  public override buildUniformLayout(): void {


    // Order is important !
    const ubo = this._uniformBuffer;
    ubo.addUniform("diffuseLeftColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("diffuseRightColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("opacityParts", 4); /* @NOTE UNUSED */
    ubo.addUniform("reflectionLeftColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("reflectionRightColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("refractionLeftColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("refractionRightColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("emissiveLeftColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("emissiveRightColor", 4); /* @NOTE UNUSED */

    ubo.addUniform("vDiffuseInfos", 2);
    ubo.addUniform("vAmbientInfos", 2);  /* @NOTE UNUSED */
    ubo.addUniform("vOpacityInfos", 2); /* @NOTE UNUSED */
    ubo.addUniform("vReflectionInfos", 2);
    ubo.addUniform("vReflectionPosition", 3);
    ubo.addUniform("vReflectionSize", 3);
    ubo.addUniform("vEmissiveInfos", 2); /* @NOTE UNUSED */
    ubo.addUniform("vLightmapInfos", 2); /* @NOTE UNUSED */
    ubo.addUniform("vSpecularInfos", 2); /* @NOTE UNUSED */
    ubo.addUniform("vBumpInfos", 3); /* @NOTE UNUSED */

    ubo.addUniform("diffuseMatrix", 16);
    ubo.addUniform("ambientMatrix", 16); /* @NOTE UNUSED */
    ubo.addUniform("opacityMatrix", 16); /* @NOTE UNUSED */
    ubo.addUniform("reflectionMatrix", 16);
    ubo.addUniform("emissiveMatrix", 16); /* @NOTE UNUSED */
    ubo.addUniform("lightmapMatrix", 16); /* @NOTE UNUSED */
    ubo.addUniform("specularMatrix", 16); /* @NOTE UNUSED */
    ubo.addUniform("bumpMatrix", 16); /* @NOTE UNUSED */
    ubo.addUniform("vTangentSpaceParams", 2); /* @NOTE UNUSED */
    ubo.addUniform("pointSize", 1); /* @NOTE UNUSED */
    ubo.addUniform("alphaCutOff", 1);
    ubo.addUniform("refractionMatrix", 16); /* @NOTE UNUSED */
    ubo.addUniform("vRefractionInfos", 4); /* @NOTE UNUSED */
    ubo.addUniform("vRefractionPosition", 3); /* @NOTE UNUSED */
    ubo.addUniform("vRefractionSize", 3); /* @NOTE UNUSED */
    ubo.addUniform("vSpecularColor", 4); /* @NOTE UNUSED */
    ubo.addUniform("vEmissiveColor", 3);
    ubo.addUniform("vDiffuseColor", 4);
    ubo.addUniform("vAmbientColor", 3);

    super.buildUniformLayout();
  }

  /**
   * Binds the submesh to this material by preparing the effect and shader to draw
   * @param world defines the world transformation matrix
   * @param mesh defines the mesh containing the submesh
   * @param subMesh defines the submesh to bind the material to
   */
  public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
    const scene = this.getScene();

    const defines = subMesh.materialDefines as RetroMaterialDefines;
    if (!defines) {
      return;
    }

    const effect = subMesh.effect;
    if (!effect) {
      return;
    }
    this._activeEffect = effect;

    // Matrices Mesh.
    mesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
    mesh.transferToEffect(world);

    // Binding unconditionally
    this._uniformBuffer.bindToEffect(effect, "Material");

    // this.prePassConfiguration.bindForSubMesh(this._activeEffect, scene, mesh, world, this.isFrozen);

    MaterialHelperGeometryRendering.Bind(scene.getEngine().currentRenderPassId, this._activeEffect, mesh, world, this);

    this._eventInfo.subMesh = subMesh;
    this._callbackPluginEventHardBindForSubMesh(this._eventInfo);

    // Normal Matrix
    // if (defines.OBJECTSPACE_NORMALMAP) {
    //   world.toNormalMatrix(this._normalMatrix);
    //   this.bindOnlyNormalMatrix(this._normalMatrix);
    // }

    const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);

    // Bones
    BindBonesParameters(mesh, effect);
    const ubo = this._uniformBuffer;
    if (mustRebind) {
      this.bindViewProjection(effect);
      if (!ubo.useUbo || !this.isFrozen || !ubo.isSync || subMesh._drawWrapper._forceRebindOnNextCall) {
        // if (RetroMaterial.FresnelEnabled && defines.FRESNEL) {
        //   // Fresnel
        //   // if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
        //   //   ubo.updateColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
        //   //   ubo.updateColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
        //   // }

        //   if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
        //     ubo.updateColor4(
        //       "opacityParts",
        //       new Color3(
        //         this.opacityFresnelParameters.leftColor.toLuminance(),
        //         this.opacityFresnelParameters.rightColor.toLuminance(),
        //         this.opacityFresnelParameters.bias,
        //       ),
        //       this.opacityFresnelParameters.power,
        //     );
        //   }

        //   if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
        //     ubo.updateColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power);
        //     ubo.updateColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias);
        //   }

        //   if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
        //     ubo.updateColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power);
        //     ubo.updateColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias);
        //   }

        //   if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
        //     ubo.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
        //     ubo.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
        //   }
        // }

        // Textures
        if (scene.texturesEnabled) {
          if (this.diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
            ubo.updateFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
            BindTextureMatrix(this.diffuseTexture, ubo, "diffuse");
          }

          // if (this.ambientTexture && RetroMaterial.AmbientTextureEnabled) {
          //   ubo.updateFloat2("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level);
          //   BindTextureMatrix(this.ambientTexture, ubo, "ambient");
          // }

          // if (this.opacityTexture && RetroMaterial.OpacityTextureEnabled) {
          //   ubo.updateFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
          //   BindTextureMatrix(this.opacityTexture, ubo, "opacity");
          // }

          // if (this._hasAlphaChannel()) {
          // if (this.transparencyMode !== Material.MATERIAL_OPAQUE) {
          ubo.updateFloat("alphaCutOff", RetroMaterial.AlphaTestCutoff);
          // }
          // }

          // @TODO @DEBUG
          const ReflectionRoughness = 0;

          if (this.reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
            ubo.updateFloat2("vReflectionInfos", this.reflectionTexture.level, ReflectionRoughness);
            ubo.updateMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());

            if (this.reflectionTexture instanceof CubeTexture && this.reflectionTexture.boundingBoxSize) {
              ubo.updateVector3("vReflectionPosition", this.reflectionTexture.boundingBoxPosition);
              ubo.updateVector3("vReflectionSize", this.reflectionTexture.boundingBoxSize);
            }
          } else {
            ubo.updateFloat2("vReflectionInfos", 0.0, ReflectionRoughness);
          }

          // if (this.emissiveTexture && RetroMaterial.EmissiveTextureEnabled) {
          //   ubo.updateFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
          //   BindTextureMatrix(this.emissiveTexture, ubo, "emissive");
          // }

          // if (this.lightmapTexture && RetroMaterial.LightmapTextureEnabled) {
          //   ubo.updateFloat2("vLightmapInfos", this.lightmapTexture.coordinatesIndex, this.lightmapTexture.level);
          //   BindTextureMatrix(this.lightmapTexture, ubo, "lightmap");
          // }

          // if (this.specularTexture && RetroMaterial.SpecularTextureEnabled) {
          //   ubo.updateFloat2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
          //   BindTextureMatrix(this.specularTexture, ubo, "specular");
          // }

          // if (this.bumpTexture && scene.getEngine().getCaps().standardDerivatives && RetroMaterial.BumpTextureEnabled) {
          //   ubo.updateFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
          //   BindTextureMatrix(this.bumpTexture, ubo, "bump");

          //   if (scene._mirroredCameraPosition) {
          //     ubo.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? 1.0 : -1.0, this.invertNormalMapY ? 1.0 : -1.0);
          //   } else {
          //     ubo.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? -1.0 : 1.0, this.invertNormalMapY ? -1.0 : 1.0);
          //   }
          // }

          // if (this.refractionTexture && RetroMaterial.RefractionTextureEnabled) {
          //   let depth = 1.0;
          //   if (!this.refractionTexture.isCube) {
          //     ubo.updateMatrix("refractionMatrix", this.refractionTexture.getReflectionTextureMatrix());

          //     if ((<any>this.refractionTexture).depth) {
          //       depth = (<any>this.refractionTexture).depth;
          //     }
          //   }
          //   ubo.updateFloat4("vRefractionInfos", this.refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);

          //   if ((<any>this.refractionTexture).boundingBoxSize) {
          //     const cubeTexture = <CubeTexture>this.refractionTexture;

          //     ubo.updateVector3("vRefractionPosition", cubeTexture.boundingBoxPosition);
          //     ubo.updateVector3("vRefractionSize", cubeTexture.boundingBoxSize);
          //   }
          // }
        }

        // Point size
        // if (this.pointsCloud) {
        //   ubo.updateFloat("pointSize", this.pointSize);
        // }

        // ubo.updateColor4("vSpecularColor", this.specularColor, this.specularPower);

        ubo.updateColor3("vEmissiveColor", MaterialFlags.EmissiveTextureEnabled && this.emissionColor ? this.emissionColor : RetroMaterial.Defaults.emissiveColor);
        ubo.updateColor4("vDiffuseColor", this.diffuseColor || RetroMaterial.Defaults.diffuseColor, this.alpha);

        // scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
        ubo.updateColor3("vAmbientColor", this.ambientColor);
      }

      // Textures
      if (scene.texturesEnabled) {
        if (this.diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
          effect.setTexture("diffuseSampler", this.diffuseTexture);
        }

        // if (this.ambientTexture && RetroMaterial.AmbientTextureEnabled) {
        //   effect.setTexture("ambientSampler", this.ambientTexture);
        // }

        // if (this.opacityTexture && RetroMaterial.OpacityTextureEnabled) {
        //   effect.setTexture("opacitySampler", this.opacityTexture);
        // }

        if (this.reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
          // if (this.reflectionTexture.isCube) {
          effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
          // } else {
          //   effect.setTexture("reflection2DSampler", this.reflectionTexture);
          // }
        }

        // if (this.emissiveTexture && RetroMaterial.EmissiveTextureEnabled) {
        //   effect.setTexture("emissiveSampler", this.emissiveTexture);
        // }

        // if (this.lightmapTexture && RetroMaterial.LightmapTextureEnabled) {
        //   effect.setTexture("lightmapSampler", this.lightmapTexture);
        // }

        // if (this.specularTexture && RetroMaterial.SpecularTextureEnabled) {
        //   effect.setTexture("specularSampler", this.specularTexture);
        // }

        // if (this.bumpTexture && scene.getEngine().getCaps().standardDerivatives && RetroMaterial.BumpTextureEnabled) {
        //   effect.setTexture("bumpSampler", this.bumpTexture);
        // }

        // if (this.refractionTexture && RetroMaterial.RefractionTextureEnabled) {
        //   if (this.refractionTexture.isCube) {
        //     effect.setTexture("refractionCubeSampler", this.refractionTexture);
        //   } else {
        //     effect.setTexture("refraction2DSampler", this.refractionTexture);
        //   }
        // }
      }

      // OIT with depth peeling
      if (this.getScene().useOrderIndependentTransparency && this.needAlphaBlendingForMesh(mesh)) {
        this.getScene().depthPeelingRenderer!.bind(effect);
      }

      this._eventInfo.subMesh = subMesh;
      this._callbackPluginEventBindForSubMesh(this._eventInfo);

      // Clip plane
      BindClipPlane(effect, this, scene);

      // Colors
      this.bindEyePosition(effect);
    } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
      this._needToBindSceneUbo = true;
    }

    if (mustRebind || !this.isFrozen) {
      // Lights
      if (scene.lightsEnabled && !this.disableLighting) {
        BindLights(scene, mesh, effect, defines, RetroMaterial.MaxSimultaneousLights);
      }

      // View
      if (
        (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) ||
        this.reflectionTexture ||
        // this.refractionTexture ||
        mesh.receiveShadows ||
        defines.PREPASS
      ) {
        this.bindView(effect);
      }

      // Fog
      BindFogParameters(scene, mesh, effect);

      // Morph targets
      if (defines.NUM_MORPH_INFLUENCERS) {
        BindMorphTargetParameters(mesh, effect);
      }

      if (defines.BAKED_VERTEX_ANIMATION_TEXTURE) {
        mesh.bakedVertexAnimationManager?.bind(effect, defines.INSTANCES);
      }

      // Log. depth
      if (this.useLogarithmicDepth) {
        BindLogDepth(defines, effect, scene);
      }

      // image processing
      // if (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess) {
      //   this._imageProcessingConfiguration.bind(this._activeEffect);
      // }
    }

    this._afterBind(mesh, this._activeEffect, subMesh);
    ubo.update();
  }

  // public override get transparencyMode(): number {
  //   if (this.diffuseTexture?.hasAlpha) {
  //     return Material.MATERIAL_ALPHABLEND;
  //   } else {
  //     return Material.MATERIAL_OPAQUE;
  //   }
  // }

  /**
   * Get the list of animatables in the material.
   * @returns the list of animatables object used in the material
   */
  public override getAnimatables(): IAnimatable[] {
    const results = super.getAnimatables();

    if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
      results.push(this.diffuseTexture);
    }

    // if (this.ambientTexture && this.ambientTexture.animations && this.ambientTexture.animations.length > 0) {
    //   results.push(this.ambientTexture);
    // }

    // if (this.opacityTexture && this.opacityTexture.animations && this.opacityTexture.animations.length > 0) {
    //   results.push(this.opacityTexture);
    // }

    if (this.reflectionTexture && this.reflectionTexture.animations && this.reflectionTexture.animations.length > 0) {
      results.push(this.reflectionTexture);
    }

    // if (this.emissiveTexture && this.emissiveTexture.animations && this.emissiveTexture.animations.length > 0) {
    //   results.push(this.emissiveTexture);
    // }

    // if (this.specularTexture && this.specularTexture.animations && this.specularTexture.animations.length > 0) {
    //   results.push(this.specularTexture);
    // }

    // if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
    //   results.push(this.bumpTexture);
    // }

    // if (this.lightmapTexture && this.lightmapTexture.animations && this.lightmapTexture.animations.length > 0) {
    //   results.push(this.lightmapTexture);
    // }

    // if (this.refractionTexture && this.refractionTexture.animations && this.refractionTexture.animations.length > 0) {
    //   results.push(this.refractionTexture);
    // }

    return results;
  }

  /**
   * Gets the active textures from the material
   * @returns an array of textures
   */
  public override getActiveTextures(): BaseTexture[] {
    const activeTextures = super.getActiveTextures();

    if (this.diffuseTexture) {
      activeTextures.push(this.diffuseTexture);
    }

    // if (this.ambientTexture) {
    //   activeTextures.push(this.ambientTexture);
    // }

    // if (this.opacityTexture) {
    //   activeTextures.push(this.opacityTexture);
    // }

    if (this.reflectionTexture) {
      activeTextures.push(this.reflectionTexture);
    }

    // if (this.emissiveTexture) {
    //   activeTextures.push(this.emissiveTexture);
    // }

    // if (this.specularTexture) {
    //   activeTextures.push(this.specularTexture);
    // }

    // if (this.bumpTexture) {
    //   activeTextures.push(this.bumpTexture);
    // }

    // if (this.lightmapTexture) {
    //   activeTextures.push(this.lightmapTexture);
    // }

    // if (this.refractionTexture) {
    //   activeTextures.push(this.refractionTexture);
    // }

    return activeTextures;
  }

  /**
   * Specifies if the material uses a texture
   * @param texture defines the texture to check against the material
   * @returns a boolean specifying if the material uses the texture
   */
  public override hasTexture(texture: BaseTexture): boolean {
    if (super.hasTexture(texture)) {
      return true;
    }

    if (this.diffuseTexture === texture) {
      return true;
    }

    // if (this.ambientTexture === texture) {
    //   return true;
    // }

    // if (this.opacityTexture === texture) {
    //   return true;
    // }

    if (this.reflectionTexture === texture) {
      return true;
    }

    // if (this.emissiveTexture === texture) {
    //   return true;
    // }

    // if (this.specularTexture === texture) {
    //   return true;
    // }

    // if (this.bumpTexture === texture) {
    //   return true;
    // }

    // if (this.lightmapTexture === texture) {
    //   return true;
    // }

    // if (this.refractionTexture === texture) {
    //   return true;
    // }

    return false;
  }

  /**
   * Disposes the material
   * @param forceDisposeEffect specifies if effects should be forcefully disposed
   * @param forceDisposeTextures specifies if textures should be forcefully disposed
   */
  public override dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
    if (forceDisposeTextures) {
      this.diffuseTexture?.dispose();
      // this.ambientTexture?.dispose();
      // this.opacityTexture?.dispose();
      this.reflectionTexture?.dispose();
      // this.emissiveTexture?.dispose();
      // this.specularTexture?.dispose();
      // this.bumpTexture?.dispose();
      // this.lightmapTexture?.dispose();
      // this.refractionTexture?.dispose();
    }

    // if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
    //   this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
    // }

    super.dispose(forceDisposeEffect, forceDisposeTextures);
  }

  /**
   * Makes a duplicate of the material, and gives it a new name
   * @param name defines the new name for the duplicated material
   * @param cloneTexturesOnlyOnce - if a texture is used in more than one channel (e.g diffuse and opacity), only clone it once and reuse it on the other channels. Default false.
   * @param rootUrl defines the root URL to use to load textures
   * @returns the cloned material
   */
  // public override clone(name: string, cloneTexturesOnlyOnce: boolean = true, rootUrl = ""): RetroMaterial {
  //   const result = SerializationHelper.Clone(() => new RetroMaterial(name, this.getScene()), this, { cloneTexturesOnlyOnce });

  //   result.name = name;
  //   result.id = name;

  //   this.stencil.copyTo(result.stencil);

  //   this._clonePlugins(result, rootUrl);

  //   return result;
  // }

  /**
   * Creates a standard material from parsed material data
   * @param source defines the JSON representation of the material
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @returns a new standard material
   */
  // public static override Parse(source: any, scene: Scene, rootUrl: string): RetroMaterial {
  //   const material = SerializationHelper.Parse(() => new RetroMaterial(source.name, scene), source, scene, rootUrl);

  //   if (source.stencil) {
  //     material.stencil.parse(source.stencil, scene, rootUrl);
  //   }

  //   Material._ParsePlugins(source, material, scene, rootUrl);

  //   return material;
  // }

  // Flags used to enable or disable a type of texture for all Standard Materials
  /**
   * Are diffuse textures enabled in the application.
   */
  // public static get DiffuseTextureEnabled(): boolean {
  //   return MaterialFlags.DiffuseTextureEnabled;
  // }
  // public static set DiffuseTextureEnabled(value: boolean) {
  //   MaterialFlags.DiffuseTextureEnabled = value;
  // }

  // /**
  //  * Are detail textures enabled in the application.
  //  */
  // public static get DetailTextureEnabled(): boolean {
  //   return MaterialFlags.DetailTextureEnabled;
  // }
  // public static set DetailTextureEnabled(value: boolean) {
  //   MaterialFlags.DetailTextureEnabled = value;
  // }

  // /**
  //  * Are ambient textures enabled in the application.
  //  */
  // public static get AmbientTextureEnabled(): boolean {
  //   return MaterialFlags.AmbientTextureEnabled;
  // }
  // public static set AmbientTextureEnabled(value: boolean) {
  //   MaterialFlags.AmbientTextureEnabled = value;
  // }

  // /**
  //  * Are opacity textures enabled in the application.
  //  */
  // public static get OpacityTextureEnabled(): boolean {
  //   return MaterialFlags.OpacityTextureEnabled;
  // }
  // public static set OpacityTextureEnabled(value: boolean) {
  //   MaterialFlags.OpacityTextureEnabled = value;
  // }

  // /**
  //  * Are reflection textures enabled in the application.
  //  */
  // public static get ReflectionTextureEnabled(): boolean {
  //   return MaterialFlags.ReflectionTextureEnabled;
  // }
  // public static set ReflectionTextureEnabled(value: boolean) {
  //   MaterialFlags.ReflectionTextureEnabled = value;
  // }

  // /**
  //  * Are emissive textures enabled in the application.
  //  */
  // public static get EmissiveTextureEnabled(): boolean {
  //   return MaterialFlags.EmissiveTextureEnabled;
  // }
  // public static set EmissiveTextureEnabled(value: boolean) {
  //   MaterialFlags.EmissiveTextureEnabled = value;
  // }

  // /**
  //  * Are specular textures enabled in the application.
  //  */
  // public static get SpecularTextureEnabled(): boolean {
  //   return MaterialFlags.SpecularTextureEnabled;
  // }
  // public static set SpecularTextureEnabled(value: boolean) {
  //   MaterialFlags.SpecularTextureEnabled = value;
  // }

  // /**
  //  * Are bump textures enabled in the application.
  //  */
  // public static get BumpTextureEnabled(): boolean {
  //   return MaterialFlags.BumpTextureEnabled;
  // }
  // public static set BumpTextureEnabled(value: boolean) {
  //   MaterialFlags.BumpTextureEnabled = value;
  // }

  // /**
  //  * Are lightmap textures enabled in the application.
  //  */
  // public static get LightmapTextureEnabled(): boolean {
  //   return MaterialFlags.LightmapTextureEnabled;
  // }
  // public static set LightmapTextureEnabled(value: boolean) {
  //   MaterialFlags.LightmapTextureEnabled = value;
  // }

  // /**
  //  * Are refraction textures enabled in the application.
  //  */
  // public static get RefractionTextureEnabled(): boolean {
  //   return MaterialFlags.RefractionTextureEnabled;
  // }
  // public static set RefractionTextureEnabled(value: boolean) {
  //   MaterialFlags.RefractionTextureEnabled = value;
  // }

  // /**
  //  * Are color grading textures enabled in the application.
  //  */
  // public static get ColorGradingTextureEnabled(): boolean {
  //   return MaterialFlags.ColorGradingTextureEnabled;
  // }
  // public static set ColorGradingTextureEnabled(value: boolean) {
  //   MaterialFlags.ColorGradingTextureEnabled = value;
  // }

  // /**
  //  * Are fresnels enabled in the application.
  //  */
  // public static get FresnelEnabled(): boolean {
  //   return MaterialFlags.FresnelEnabled;
  // }
  // public static set FresnelEnabled(value: boolean) {
  //   MaterialFlags.FresnelEnabled = value;
  // }
}

// RegisterClass("BABYLON.RetroMaterial", RetroMaterial);

// Scene.DefaultMaterialFactory = (scene: Scene) => {
//   return new RetroMaterial("default material", scene);
// }
