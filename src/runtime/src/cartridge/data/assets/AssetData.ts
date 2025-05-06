import { AssetType } from "../../archive";
import { IMaterialAssetData } from "./MaterialAssetData";

import { IMeshAssetData } from './MeshAssetData';
import { IMeshSupplementaryAssetData } from './MeshSupplementaryAssetData';
import { IScriptAssetData } from './ScriptAssetData';
import { ISoundAssetData } from './SoundAssetData';
import { ITextureAssetData } from './TextureAssetData';

export type IAssetData = IMeshAssetData | IMeshSupplementaryAssetData | IScriptAssetData | ISoundAssetData | ITextureAssetData | IMaterialAssetData;
export type IAssetDataOfType<TAssetType extends AssetType> = Extract<IAssetData, { type: TAssetType }>;
