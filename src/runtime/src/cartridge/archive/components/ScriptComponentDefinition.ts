import type { ScriptComponentData } from '@polyzone/runtime/src/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars
import type { CartridgeArchive } from '../CartridgeArchive'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw script component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ScriptComponentData}.
 */
export interface ScriptComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.Script;
  scriptFileId: string | null | undefined; // @TODO Rename to `scriptAssetId` // @TODO make everything nulldefinedable
}
