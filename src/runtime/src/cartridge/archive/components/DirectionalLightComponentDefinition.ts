import type { DirectionalLightComponentData } from '@polyzone/runtime/cartridge/data'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Color3Definition } from "../util";

import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link DirectionalLightComponentData}.
 */
export interface DirectionalLightComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.DirectionalLight;
  intensity: number;
  color: Color3Definition;
}
