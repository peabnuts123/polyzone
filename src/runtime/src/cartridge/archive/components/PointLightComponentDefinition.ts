import type { PointLightComponentData } from '@polyzone/runtime/cartridge/data'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Color3Definition } from "../util";
import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link PointLightComponentData}.
 */
export interface PointLightComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.PointLight;
  intensity: number;
  color: Color3Definition;
}
