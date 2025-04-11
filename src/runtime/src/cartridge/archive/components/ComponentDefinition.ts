import type { ComponentData } from '@polyzone/runtime/src/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars

import type { CartridgeArchive } from '../CartridgeArchive'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { ComponentDefinitionType } from "./ComponentDefinitionType";
import { CameraComponentDefinition } from './CameraComponentDefinition';
import { DirectionalLightComponentDefinition } from './DirectionalLightComponentDefinition';
import { MeshComponentDefinition } from './MeshComponentDefinition';
import { PointLightComponentDefinition } from './PointLightComponentDefinition';
import { ScriptComponentDefinition } from './ScriptComponentDefinition';


export interface ComponentDefinitionBase {
  id: string;
  type: ComponentDefinitionType;
}

/**
 * Raw game object component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ComponentData}.
 */
export type ComponentDefinition = CameraComponentDefinition
  | DirectionalLightComponentDefinition
  | MeshComponentDefinition
  | PointLightComponentDefinition
  | ScriptComponentDefinition;
