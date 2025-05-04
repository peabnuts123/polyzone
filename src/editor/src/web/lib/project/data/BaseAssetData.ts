import { makeObservable } from "mobx";

import { AssetType, CommonAssetDataArgs as CommonAssetDataArgsRuntime, IBaseAssetData } from "@polyzone/runtime/src/cartridge";

import { AssetDefinitionOfType } from "../definition";
import { AssetDb } from "./AssetDb";

export interface CommonAssetDataArgs extends CommonAssetDataArgsRuntime {
  hash: string;
}

export abstract class BaseAssetData<TAssetType extends AssetType> implements IBaseAssetData<TAssetType> {
  private _baseAssetData: IBaseAssetData<TAssetType>;

  /**
   * Hash of the asset's content.
   */
  public hash: string;

  public constructor({ hash }: CommonAssetDataArgs, baseAssetData: IBaseAssetData<TAssetType>) {
    this._baseAssetData = baseAssetData;
    this.hash = hash;

    type PrivateProperties = 'toString';
    makeObservable<this, PrivateProperties>(this, {
      id: true,
      path: true,
      toString: true,
      fileExtension: true,
      babylonFetchUrl: true,
      pathList: true,
      baseName: true,
      loadDefinition: true,
      type: true,
      hash: true,
    });
    makeObservable<typeof baseAssetData, PrivateProperties>(this._baseAssetData, {
      id: true,
      path: true,
      toString: true,
      fileExtension: true,
      babylonFetchUrl: true,
      pathList: true,
      baseName: true,
      loadDefinition: true,
      type: true,
    });
  }

  public get id(): string { return this._baseAssetData.id; }

  /**
   * The path within the game data wherein this asset lies.
   * @NOTE This property is NOT for fetching the actual data.
   * See {@link babylonFetchUrl} instead.
   */
  public get path(): string { return this._baseAssetData.path; }
  public set path(path: string) { this._baseAssetData.path = path; }

  public toString(): string {
    return this._baseAssetData.toString();
  }

  /**
   * File extension of this file. Includes the dot e.g. `.txt`.
   * Returns empty string if file has no extension.
   */
  public get fileExtension(): string { return this._baseAssetData.fileExtension; }

  /**
   * The URL from which this asset can be fetched by Babylon.
   * @NOTE different from {@link path}.
   */
  public get babylonFetchUrl(): string { return this._baseAssetData.babylonFetchUrl; }

  /**
   * The asset's virtual path as a list of string path segments,
   * excluding the file's base name itself.
   */
  public get pathList(): string[] { return this._baseAssetData.pathList; }

  /**
   * The filename of the asset. e.g. `sprite.png`
   */
  public get baseName(): string { return this._baseAssetData.baseName; }

  public get type(): TAssetType { return this._baseAssetData.type; }

  public loadDefinition(assetDefinition: AssetDefinitionOfType<TAssetType>, assetDb: AssetDb): void {
    this._baseAssetData.loadDefinition(assetDefinition, assetDb);
  }

  public abstract toAssetDefinition(): AssetDefinitionOfType<TAssetType>;
}
