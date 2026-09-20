import type { CameraComponentData } from '@polyzone/runtime/cartridge/data'; // eslint-disable-line @typescript-eslint/no-unused-vars

import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";

/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link CameraComponentData}.
 */
export interface CameraComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.Camera;
  // FOV ?
}
