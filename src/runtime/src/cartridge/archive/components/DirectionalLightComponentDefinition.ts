import type { DirectionalLightComponentData } from '@polyzone/runtime/src/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars
import type { CartridgeArchive } from '../CartridgeArchive'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { ColorDefinition } from "../util";

import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw directional light component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link DirectionalLightComponentData}.
 */
export interface DirectionalLightComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.DirectionalLight;
  intensity: number;
  color: ColorDefinition;
}
