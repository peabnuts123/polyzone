import { makeAutoObservable, makeObservable } from "mobx";

import { Color3 } from "@polyzone/core/src";

import {
  AssetType,
  IMeshAssetData,
  MeshAssetData as MeshAssetDataRuntime,
  IMeshAssetMaterialOverrideData,
  ITextureAssetData,
  MeshAssetMaterialOverrideData as MeshAssetMaterialOverrideDataRuntime,
  MeshAssetMaterialOverrideDefinition,
  MeshAssetMaterialOverrideReflectionData,
} from "@polyzone/runtime/src/cartridge";
import { MeshAssetDefinition } from "@lib/project/definition";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";
import { AssetDb } from "../AssetDb";


export class MeshAssetMaterialOverrideData implements IMeshAssetMaterialOverrideData {
  private _meshAssetMaterialOverrideData: MeshAssetMaterialOverrideDataRuntime;

  public diffuseColorEnabled: boolean = false;
  public diffuseTextureEnabled: boolean = false;
  public emissionColorEnabled: boolean = false;
  public reflectionEnabled: boolean = false;

  public constructor(meshAssetMaterialOverrideDataRuntime: MeshAssetMaterialOverrideDataRuntime) {
    this._meshAssetMaterialOverrideData = meshAssetMaterialOverrideDataRuntime;
    makeAutoObservable(this);
    makeAutoObservable(this._meshAssetMaterialOverrideData);
  }

  public isEmpty(): boolean {
    return this.isDiffuseColorEmpty() && this.isDiffuseTextureEmpty() && this.isEmissionColorEmpty() && this.isReflectionEmpty();
  }

  public isDiffuseColorEmpty(): boolean { return this.diffuseColorEnabled === false || this.diffuseColor === undefined; }
  public isDiffuseTextureEmpty(): boolean { return this.diffuseTextureEnabled === false || this.diffuseTexture === undefined; }
  public isEmissionColorEmpty(): boolean { return this.emissionColorEnabled === false || this.emissionColor === undefined; }
  public isReflectionEmpty(): boolean { return this.reflectionEnabled === false || this.reflection === undefined; }

  public static createNew(): MeshAssetMaterialOverrideData {
    return new MeshAssetMaterialOverrideData(
      new MeshAssetMaterialOverrideDataRuntime(),
    );
  }

  public static createFrom(definition: MeshAssetMaterialOverrideDefinition, assetDb: AssetDb): MeshAssetMaterialOverrideData {
    return new MeshAssetMaterialOverrideData(
      MeshAssetMaterialOverrideDataRuntime.createFrom(definition, assetDb),
    );
  }

  public get diffuseColor(): Color3 | undefined { return this._meshAssetMaterialOverrideData.diffuseColor; }
  public set diffuseColor(value: Color3 | undefined) { this._meshAssetMaterialOverrideData.diffuseColor = value; }
  public get diffuseTexture(): ITextureAssetData | undefined { return this._meshAssetMaterialOverrideData.diffuseTexture; }
  public set diffuseTexture(value: ITextureAssetData | undefined) { this._meshAssetMaterialOverrideData.diffuseTexture = value; }
  public get emissionColor(): Color3 | undefined { return this._meshAssetMaterialOverrideData.emissionColor; }
  public set emissionColor(value: Color3 | undefined) { this._meshAssetMaterialOverrideData.emissionColor = value; }
  public get reflection(): MeshAssetMaterialOverrideReflectionData | undefined { return this._meshAssetMaterialOverrideData.reflection; }
  public set reflection(value: MeshAssetMaterialOverrideReflectionData | undefined) { this._meshAssetMaterialOverrideData.reflection = value; }
}

export class MeshAssetData extends BaseAssetData<AssetType.Mesh> implements IMeshAssetData {
  private _meshAssetData: MeshAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const meshAssetData = new MeshAssetDataRuntime(args);
    super(args, meshAssetData);
    this._meshAssetData = meshAssetData;

    makeObservable(this, {
      getOverridesForMaterial: true,
      setMaterialOverride: true,
      materialOverrides: true,
      areAllOverridesEmpty: true,
      isMaterialOverrideEmpty: true,
    });
    makeObservable<MeshAssetDataRuntime, '_materialOverrides'>(this._meshAssetData, {
      getOverridesForMaterial: true,
      materialOverrides: true,
      _materialOverrides: true,
    });
  }

  public override loadDefinition(assetDefinition: MeshAssetDefinition, assetDb: AssetDb): void {
    // Call underlying implementation
    this._meshAssetData.loadDefinition(assetDefinition, assetDb);
    // Convert overrides to observable versions
    // @NOTE Leaky abstraction :/
    for (const materialNameKey in this.materialOverrides) {
      // @NOTE Type laundering :/
      this.materialOverrides[materialNameKey] = new MeshAssetMaterialOverrideData(this.materialOverrides[materialNameKey] as IMeshAssetMaterialOverrideData as MeshAssetMaterialOverrideDataRuntime);
    }
  }

  public setMaterialOverride(materialName: string, mutator: (override: MeshAssetMaterialOverrideData) => void): void {
    let materialOverrideData = this.getOverridesForMaterial(materialName);
    if (materialOverrideData == undefined) {
      this.materialOverrides[materialName] = materialOverrideData = MeshAssetMaterialOverrideData.createNew();
    }

    mutator(materialOverrideData);
  }

  public areAllOverridesEmpty(): boolean {
    for (const materialName in this.materialOverrides) {
      const overrideData = this.materialOverrides[materialName];
      if (!overrideData.isEmpty()) {
        return false;
      }
    }

    return true;
  }

  public isMaterialOverrideEmpty(materialName: string): boolean {
    const overrideData = this.getOverridesForMaterial(materialName);
    if (overrideData === undefined) return true;
    else return overrideData.isEmpty();
  }

  public getOverridesForMaterial(materialName: string): MeshAssetMaterialOverrideData | undefined {
    return this._meshAssetData.getOverridesForMaterial(materialName) as MeshAssetMaterialOverrideData | undefined;
  }

  public get materialOverrides(): Record<string, MeshAssetMaterialOverrideData> {
    return this._meshAssetData.materialOverrides as Record<string, MeshAssetMaterialOverrideData>;
  }
}
