import { AssetDb } from "@lib/project/data/AssetDb";
import { Color3 } from "@polyzone/core/src";
import { ITextureAssetData, MeshAssetMaterialOverrideReflectionData } from "@polyzone/runtime/src/cartridge";
import { IMaterialData, MaterialData as MaterialDataRuntime, MaterialDefinition } from "@polyzone/runtime/src/world";
import { makeAutoObservable } from "mobx";

export class MaterialData implements IMaterialData {
  private _materialData: MaterialDataRuntime;

  public diffuseColorEnabled: boolean;
  public diffuseTextureEnabled: boolean;
  public emissionColorEnabled: boolean;
  public reflectionEnabled: boolean;

  private constructor(materialData: MaterialDataRuntime) {
    this._materialData = materialData;

    this.diffuseColorEnabled = this._materialData.diffuseColor !== undefined;
    this.diffuseTextureEnabled = this._materialData.diffuseTexture !== undefined;
    this.emissionColorEnabled = this._materialData.emissionColor !== undefined;
    this.reflectionEnabled = this._materialData.reflection !== undefined;

    makeAutoObservable(this);
    makeAutoObservable(this._materialData);
  }

  public static fromDefinition(definition: MaterialDefinition, asset: AssetDb): MaterialData {
    return new MaterialData(
      MaterialDataRuntime.fromDefinition(definition, asset),
    );
  }

  public get diffuseColorRawValue(): Color3 | undefined { return this._materialData.diffuseColor; }
  public get diffuseColor(): Color3 | undefined {
    if (this.diffuseColorEnabled) return this._materialData.diffuseColor;
    else return undefined;
  }
  public set diffuseColor(value: Color3 | undefined) { this._materialData.diffuseColor = value; }

  public get diffuseTextureRawValue(): ITextureAssetData | undefined { return this._materialData.diffuseTexture; }
  public get diffuseTexture(): ITextureAssetData | undefined {
    if (this.diffuseTextureEnabled) return this._materialData.diffuseTexture;
    else return undefined;
  }
  public set diffuseTexture(value: ITextureAssetData | undefined) { this._materialData.diffuseTexture = value; }

  public get emissionColorRawValue(): Color3 | undefined { return this._materialData.emissionColor; }
  public get emissionColor(): Color3 | undefined {
    if (this.emissionColorEnabled) return this._materialData.emissionColor;
    else return undefined;
  }
  public set emissionColor(value: Color3 | undefined) { this._materialData.emissionColor = value; }

  public get reflectionRawValue(): MeshAssetMaterialOverrideReflectionData | undefined { return this._materialData.reflection; }
  public get reflection(): MeshAssetMaterialOverrideReflectionData | undefined {
    if (this.reflectionEnabled) return this._materialData.reflection;
    else return undefined;
  }
  public set reflection(value: MeshAssetMaterialOverrideReflectionData | undefined) { this._materialData.reflection = value; }
}
