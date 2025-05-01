import type { IScriptAssetData } from "../assets";
import { IComponentData } from "./ComponentData";

export interface IScriptComponentData extends IComponentData {
  get scriptAsset(): IScriptAssetData | undefined;
}

/**
 * Configuration data for a custom component script written by the user.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class ScriptComponentData implements IScriptComponentData {
  public readonly id: string;

  /** {@link IScriptAssetData} containing the script asset. */
  public scriptAsset: IScriptAssetData | undefined;

  public constructor(id: string, scriptAsset: IScriptAssetData | undefined) {
    this.id = id;

    this.scriptAsset = scriptAsset;
  }
}
