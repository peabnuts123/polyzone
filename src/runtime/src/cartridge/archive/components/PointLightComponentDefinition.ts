import type { PointLightComponentData } from '@polyzone/runtime/src/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars
import type { CartridgeArchive } from '../CartridgeArchive'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { ColorDefinition } from "../util";
import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw point light component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link PointLightComponentData}.
 */
export interface PointLightComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.PointLight;
  intensity: number;
  color: ColorDefinition;
}
