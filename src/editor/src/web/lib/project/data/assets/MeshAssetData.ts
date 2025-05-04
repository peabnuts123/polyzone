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
  MeshAssetMaterialOverrideReflectionType,
  MeshAssetMaterialOverrideReflectionDataOfType,
  MeshAssetMaterialOverrideReflectionBoxNetData,
  MeshAssetMaterialOverrideReflectionDefinitionOfType,
  MeshAssetMaterialOverrideReflection3x2Data,
  MeshAssetMaterialOverrideReflection6x1Data,
  MeshAssetMaterialOverrideReflectionSeparateData,
} from "@polyzone/runtime/src/cartridge";
import { MeshAssetDefinition } from "@lib/project/definition";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";
import { AssetDb } from "../AssetDb";
import { toColor3Definition } from "@polyzone/runtime/src/util";


export class MeshAssetMaterialOverrideData implements IMeshAssetMaterialOverrideData {
  private _meshAssetMaterialOverrideData: MeshAssetMaterialOverrideDataRuntime;

  public diffuseColorEnabled: boolean;
  public diffuseTextureEnabled: boolean;
  public emissionColorEnabled: boolean;
  public reflectionEnabled: boolean;

  public constructor(meshAssetMaterialOverrideDataRuntime: MeshAssetMaterialOverrideDataRuntime) {
    this._meshAssetMaterialOverrideData = meshAssetMaterialOverrideDataRuntime;

    this.diffuseColorEnabled = meshAssetMaterialOverrideDataRuntime.diffuseColor !== undefined;
    this.diffuseTextureEnabled = meshAssetMaterialOverrideDataRuntime.diffuseTexture !== undefined;
    this.emissionColorEnabled = meshAssetMaterialOverrideDataRuntime.emissionColor !== undefined;
    this.reflectionEnabled = meshAssetMaterialOverrideDataRuntime.reflection !== undefined;

    makeAutoObservable(this);
    makeAutoObservable(this._meshAssetMaterialOverrideData);
  }

  public toDefinition(): MeshAssetMaterialOverrideDefinition {
    return {
      diffuseColor: this.diffuseColor ? toColor3Definition(this.diffuseColor) : undefined,
      emissionColor: this.emissionColor ? toColor3Definition(this.emissionColor) : undefined,
      diffuseTextureAssetId: this.diffuseTexture?.id,
      reflection: this.reflection ? reflectionDataToDefinition(this.reflection) : undefined,
    };
  }

  public isEmpty(): boolean {
    return this.diffuseColor === undefined && this.diffuseTexture === undefined && this.emissionColor === undefined && this.reflection === undefined;
  }

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

  public get diffuseColorRawValue(): Color3 | undefined { return this._meshAssetMaterialOverrideData.diffuseColor; }
  public get diffuseColor(): Color3 | undefined {
    if (this.diffuseColorEnabled) return this._meshAssetMaterialOverrideData.diffuseColor;
    else return undefined;
  }
  public set diffuseColor(value: Color3 | undefined) { this._meshAssetMaterialOverrideData.diffuseColor = value; }

  public get diffuseTextureRawValue(): ITextureAssetData | undefined { return this._meshAssetMaterialOverrideData.diffuseTexture; }
  public get diffuseTexture(): ITextureAssetData | undefined {
    if (this.diffuseTextureEnabled) return this._meshAssetMaterialOverrideData.diffuseTexture;
    else return undefined;
  }
  public set diffuseTexture(value: ITextureAssetData | undefined) { this._meshAssetMaterialOverrideData.diffuseTexture = value; }

  public get emissionColorRawValue(): Color3 | undefined { return this._meshAssetMaterialOverrideData.emissionColor; }
  public get emissionColor(): Color3 | undefined {
    if (this.emissionColorEnabled) return this._meshAssetMaterialOverrideData.emissionColor;
    else return undefined;
  }
  public set emissionColor(value: Color3 | undefined) { this._meshAssetMaterialOverrideData.emissionColor = value; }

  public get reflectionRawValue(): MeshAssetMaterialOverrideReflectionData | undefined { return this._meshAssetMaterialOverrideData.reflection; }
  public get reflection(): MeshAssetMaterialOverrideReflectionData | undefined {
    if (this.reflectionEnabled) return this._meshAssetMaterialOverrideData.reflection;
    else return undefined;
  }
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

  public toAssetDefinition(): MeshAssetDefinition {
    return {
      id: this.id,
      type: AssetType.Mesh,
      hash: this.hash,
      path: this.path,
      materialOverrides: Object.keys(this.materialOverrides).reduce((curr, next) => {
        curr[next] = this.materialOverrides[next].toDefinition();
        return curr;
      }, {} as Record<string, MeshAssetMaterialOverrideDefinition>),
    };
  }

  public get materialOverrides(): Record<string, MeshAssetMaterialOverrideData> {
    return this._meshAssetData.materialOverrides as Record<string, MeshAssetMaterialOverrideData>;
  }
}


export function reflectionDataToDefinition<TReflectionType extends MeshAssetMaterialOverrideReflectionType>(reflection: MeshAssetMaterialOverrideReflectionDataOfType<TReflectionType>): MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType> {
  switch (reflection.type) {
    case "box-net":
      const reflectionBoxNet = reflection as MeshAssetMaterialOverrideReflectionBoxNetData;
      return {
        type: reflectionBoxNet.type,
        strength: reflectionBoxNet.strength,
        textureAssetId: reflectionBoxNet.texture?.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    case "3x2":
      const reflection3x2 = reflection as MeshAssetMaterialOverrideReflection3x2Data;
      return {
        type: reflection3x2.type,
        strength: reflection3x2.strength,
        textureAssetId: reflection3x2.texture?.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    case "6x1":
      const reflection6x1 = reflection as MeshAssetMaterialOverrideReflection6x1Data;
      return {
        type: reflection6x1.type,
        strength: reflection6x1.strength,
        textureAssetId: reflection6x1.texture?.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    case "separate":
      const reflectionSeparate = reflection as MeshAssetMaterialOverrideReflectionSeparateData;
      return {
        type: reflectionSeparate.type,
        strength: reflectionSeparate.strength,
        pxTextureAssetId: reflectionSeparate.pxTexture?.id,
        nxTextureAssetId: reflectionSeparate.nxTexture?.id,
        pyTextureAssetId: reflectionSeparate.pyTexture?.id,
        nyTextureAssetId: reflectionSeparate.nyTexture?.id,
        pzTextureAssetId: reflectionSeparate.pzTexture?.id,
        nzTextureAssetId: reflectionSeparate.nzTexture?.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    default:
      throw new Error(`Unimplemented reflection data type: '${(reflection as any).type}'`);
  }
}
