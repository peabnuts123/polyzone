import type { MeshComponentData } from '@polyzone/runtime/cartridge/data'; // eslint-disable-line @typescript-eslint/no-unused-vars

import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link MeshComponentData}.
 */
export interface MeshComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.Mesh;
  meshFileId: string | null; // @TODO Rename to `meshAssetId`
}
