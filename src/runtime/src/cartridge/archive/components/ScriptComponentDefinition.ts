import type { ScriptComponentData } from '@polyzone/runtime/cartridge/data'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link ScriptComponentData}.
 */
export interface ScriptComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.Script;
  scriptFileId: string | null; // @TODO Rename to `scriptAssetId`
}
