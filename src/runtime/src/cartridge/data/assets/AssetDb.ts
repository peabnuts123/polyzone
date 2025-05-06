import type { AssetDefinition, AssetDefinitionOfType } from '@polyzone/runtime/src/cartridge/archive';
import type { IFileSystem, VirtualFile } from '@polyzone/runtime/src/filesystem';
import { AssetType } from '@polyzone/runtime/src/cartridge';

import { IAssetData, IAssetDataOfType } from './AssetData';
import { IMeshAssetData, MeshAssetData } from './MeshAssetData';
import { IMeshSupplementaryAssetData, MeshSupplementaryAssetData } from './MeshSupplementaryAssetData';
import { IScriptAssetData, ScriptAssetData } from './ScriptAssetData';
import { ISoundAssetData, SoundAssetData } from './SoundAssetData';
import { ITextureAssetData, TextureAssetData } from './TextureAssetData';
import { IMaterialAssetData, MaterialAssetData } from './MaterialAssetData';
import { CommonAssetDataArgs } from "./BaseAssetData";


export interface IAssetDb {
  get assets(): IAssetData[];
  get fileSystem(): IFileSystem;
  getById<TAssetType extends AssetType>(
    assetId: string,
    expectedType: TAssetType,
  ): IAssetDataOfType<TAssetType>;
  loadAsset(asset: IAssetData): Promise<VirtualFile>;
}

export class AssetDb implements IAssetDb {
  public readonly assets: IAssetData[];
  public readonly fileSystem: IFileSystem;

  public constructor(assetDefinitions: AssetDefinition[], fileSystem: IFileSystem, createAssetData: CreateAssetDataFn) {
    this.fileSystem = fileSystem;

    // Load all definitions into equivalent "data" classes
    // @NOTE We first must load everything in a basic capacity BEFORE
    // reading all the definition data. This is so that assets can load references to other assets
    // i.e. all assets have to be loaded in the AssetDb before we can initialise them.
    this.assets = assetDefinitions.map((assetDefinition) => {
      return createAssetData(
        assetDefinition,
        fileSystem,
      );
    });

    // Initialise each "data" class, now that all assets are loaded into the db
    this.assets.forEach((asset, index) => {
      /* @NOTE Type laundering. We know that the Definition is paired with the Data type,
       * as it was just created from it.
       */
      asset.loadDefinition(assetDefinitions[index] as any, this);
    });
  }

  // @TODO I think this should return `undefined` and the caller should handle that
  public getById<TAssetType extends AssetType>(
    assetId: string,
    expectedType: TAssetType,
  ): IAssetDataOfType<TAssetType> {
    const asset = this.assets.find((asset) => asset.id === assetId);
    if (asset === undefined) {
      throw new Error(`No asset found in AssetDb with Id: ${assetId}`);
    }

    if (asset.type !== expectedType) {
      throw new Error(`Asset has incorrect type. Expected ${expectedType}. Found: ${asset.type}`);
    }

    return asset as IAssetDataOfType<TAssetType>;
  }

  public async loadAsset(asset: IAssetData): Promise<VirtualFile> {
    return this.fileSystem.readFile(asset.path);
  }
}

export type CreateAssetDataFn = <TAssetType extends AssetType>(assetDefinition: AssetDefinitionOfType<TAssetType>, fileSystem: IFileSystem) => IAssetDataOfType<TAssetType>;

export function createAssetData<TAssetType extends AssetType>(assetDefinition: AssetDefinitionOfType<TAssetType>, fileSystem: IFileSystem): IAssetDataOfType<TAssetType> {
  const args: CommonAssetDataArgs = {
    id: assetDefinition.id,
    path: assetDefinition.path,
    resolverProtocol: fileSystem.resolverProtocol,
  };

  // @TODO Why does TypeScript want everything to be type laundered here?
  switch (assetDefinition.type) {
    case AssetType.Mesh:
      return new MeshAssetData(args) as IMeshAssetData as IAssetDataOfType<TAssetType>;
    case AssetType.MeshSupplementary:
      return new MeshSupplementaryAssetData(args) as IMeshSupplementaryAssetData as IAssetDataOfType<TAssetType>;
    case AssetType.Script:
      return new ScriptAssetData(args) as IScriptAssetData as IAssetDataOfType<TAssetType>;
    case AssetType.Sound:
      return new SoundAssetData(args) as ISoundAssetData as IAssetDataOfType<TAssetType>;
    case AssetType.Texture:
      return new TextureAssetData(args) as ITextureAssetData as IAssetDataOfType<TAssetType>;
    case AssetType.Material:
      return new MaterialAssetData(args) as IMaterialAssetData as IAssetDataOfType<TAssetType>;
    default:
      throw new Error(`Unimplemented AssetType: ${assetDefinition.type}`);
  }
}
