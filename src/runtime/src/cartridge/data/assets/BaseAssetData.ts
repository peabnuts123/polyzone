import type Resolver from "@polyzone/runtime/src/Resolver"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { baseName, getFileExtension, toPathList } from "@polyzone/runtime/src/util";

import { AssetDefinitionOfType, AssetType } from "../../archive";
import { IAssetDb } from "./AssetDb";

export interface CommonAssetDataArgs {
  id: string;
  path: string;
  resolverProtocol: string;
}

export interface IBaseAssetData<TAssetType extends AssetType> {
  get id(): string;
  get path(): string;
  set path(value: string);
  toString(): string;
  get fileExtension(): string;
  get babylonFetchUrl(): string;
  get pathList(): string[];
  get baseName(): string;
  loadDefinition(assetDefinition: AssetDefinitionOfType<TAssetType>, assetDb: IAssetDb): void;
  get type(): TAssetType;
}

export abstract class BaseAssetData<TAssetType extends AssetType> implements IBaseAssetData<TAssetType> {
  /**
   * Unique ID for this asset.
   */
  public readonly id: string;
  /**
   * The path within the game data wherein this asset lies.
   * @NOTE This property is NOT for fetching the actual data.
   * See {@link babylonFetchUrl} instead.
   */
  public path: string;
  /**
   * Protocol scheme for identifying which resolver handler should resolve this asset.
   * @see {@link Resolver}
   */
  private readonly resolverProtocol: string;

  public constructor({ id, path, resolverProtocol }: CommonAssetDataArgs) {
    this.id = id;
    this.path = path;
    this.resolverProtocol = resolverProtocol;
  }

  public toString(): string {
    return `Asset(${this.id}, ${this.type}, ${this.path})`;
  }

  /**
   * File extension of this file. Includes the dot e.g. `.txt`.
   * Returns empty string if file has no extension.
   */
  public get fileExtension(): string {
    return getFileExtension(this.path);
  }

  /**
   * The URL from which this asset can be fetched by Babylon.
   * @NOTE different from {@link path}.
   */
  public get babylonFetchUrl(): string {
    // @NOTE Append a random parameter to asset requests to prevent browser/babylon from caching the data
    const cacheBustParam = (~~(Math.random() * 0x10000 + 0x10000)).toString(16);
    const url = new URL(`${this.resolverProtocol}${this.path}`);
    url.searchParams.set('cache_bust', cacheBustParam);
    return url.toString();
  }

  /**
   * The asset's virtual path as a list of string path segments,
   * excluding the file's base name itself.
   */
  public get pathList(): string[] {
    return toPathList(this.path);
  }

  /**
   * The filename of the asset. e.g. `sprite.png`
   */
  public get baseName(): string {
    return baseName(this.path);
  }

  public abstract loadDefinition(assetDefinition: AssetDefinitionOfType<TAssetType>, assetDb: IAssetDb): void;

  public abstract get type(): TAssetType;
}
