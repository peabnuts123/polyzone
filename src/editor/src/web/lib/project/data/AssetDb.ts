import { makeAutoObservable } from 'mobx';

import type { IFileSystem, VirtualFile } from '@polyzone/runtime/src/filesystem';
import {
  AssetType,
  AssetDb as AssetDbRuntime,
  IAssetDb,
  CreateAssetDataFn,
  AssetDefinitionOfType as AssetDefinitionOfTypeRuntime,
} from '@polyzone/runtime/src/cartridge';

import { AssetDefinition, AssetDefinitionOfType } from '../definition';
import { AssetData, AssetDataOfType } from './AssetData';
import { CommonAssetDataArgs } from './BaseAssetData';
import {
  MeshAssetData,
  MeshSupplementaryAssetData,
  ScriptAssetData,
  SoundAssetData,
  TextureAssetData,
  MaterialAssetData,
} from './assets';


export class AssetDb implements IAssetDb {
  private _assetDb: AssetDbRuntime;

  public constructor(assetDefinitions: AssetDefinition[], fileSystem: IFileSystem) {
    this._assetDb = new AssetDbRuntime(assetDefinitions, fileSystem, __createAssetDataForRuntime);
    makeAutoObservable(this);
    makeAutoObservable(this._assetDb);
  }

  public getAllOfType<TAssetType extends AssetType>(type: TAssetType): AssetDataOfType<TAssetType>[] {
    return this.assets.filter((asset): asset is AssetDataOfType<TAssetType> => asset.type === type);
  }

  public findById(assetId: string): AssetData | undefined {
    return this.assets.find((asset) => asset.id === assetId);
  }

  public add(asset: AssetData): void {
    this.assets.push(asset);
  }

  public remove(assetId: string): void {
    const assetIndex = this.assets.findIndex((asset) => asset.id === assetId);
    if (assetIndex === -1) {
      console.warn(`[AssetDb] (remove) Could not remove asset with ID '${assetId}' from AssetDb - no asset exists with this ID`);
      return;
    }
    this.assets.splice(assetIndex, 1);
  }

  public getAll(): AssetData[] {
    return this.assets;
  }

  // @TODO I think this should return `undefined` and the caller should handle that
  public getById<TAssetType extends AssetType>(assetId: string, expectedType: TAssetType): AssetDataOfType<TAssetType> {
    return this._assetDb.getById(assetId, expectedType) as AssetDataOfType<TAssetType>;
  }
  public loadAsset(asset: AssetData): Promise<VirtualFile> {
    return this._assetDb.loadAsset(asset);
  }

  public get assets(): AssetData[] { return this._assetDb.assets as AssetData[]; }
  public get fileSystem(): IFileSystem { return this._assetDb.fileSystem; }
}

/**
 * Copy of @see {@link createAssetData} with types adhering to `@polyzone/runtime`
 */
export const __createAssetDataForRuntime: CreateAssetDataFn = <TAssetType extends AssetType>(assetDefinition: AssetDefinitionOfTypeRuntime<TAssetType>, fileSystem: IFileSystem) => {
  function isEditorAssetDefinition(assetDefinition: AssetDefinitionOfTypeRuntime<TAssetType>): assetDefinition is AssetDefinitionOfType<TAssetType> {
    return 'hash' in assetDefinition;
  }

  if (!isEditorAssetDefinition(assetDefinition)) {
    throw new Error(`Expected editor asset definition but received runtime asset definition`);
  }

  return createAssetData(assetDefinition, fileSystem);
};

export function createAssetData<TAssetType extends AssetType>(assetDefinition: AssetDefinitionOfType<TAssetType>, fileSystem: IFileSystem): AssetDataOfType<TAssetType> {
  const args: CommonAssetDataArgs = {
    id: assetDefinition.id,
    path: assetDefinition.path,
    hash: assetDefinition.hash,
    resolverProtocol: fileSystem.resolverProtocol,
  };

  // @TODO Why does TypeScript want everything to be type laundered here?
  switch (assetDefinition.type) {
    case AssetType.Mesh:
      return new MeshAssetData(args) as AssetDataOfType<TAssetType>;
    case AssetType.MeshSupplementary:
      return new MeshSupplementaryAssetData(args) as AssetDataOfType<TAssetType>;
    case AssetType.Script:
      return new ScriptAssetData(args) as AssetDataOfType<TAssetType>;
    case AssetType.Sound:
      return new SoundAssetData(args) as AssetDataOfType<TAssetType>;
    case AssetType.Texture:
      return new TextureAssetData(args) as AssetDataOfType<TAssetType>;
    case AssetType.Material:
      return new MaterialAssetData(args) as AssetDataOfType<TAssetType>;
    default:
      throw new Error(`Unimplemented AssetType: ${assetDefinition.type}`);
  }
};
