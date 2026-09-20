import type { IComponentData } from '@polyzone/runtime/cartridge/data'; // eslint-disable-line @typescript-eslint/no-unused-vars

import { CameraComponentDefinition } from './CameraComponentDefinition';
import { DirectionalLightComponentDefinition } from './DirectionalLightComponentDefinition';
import { MeshComponentDefinition } from './MeshComponentDefinition';
import { PointLightComponentDefinition } from './PointLightComponentDefinition';
import { ScriptComponentDefinition } from './ScriptComponentDefinition';


export interface ComponentDefinitionBase {
  id: string;
}

/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link IComponentData}.
 */
export type ComponentDefinition = CameraComponentDefinition
  | DirectionalLightComponentDefinition
  | MeshComponentDefinition
  | PointLightComponentDefinition
  | ScriptComponentDefinition;
