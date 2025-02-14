/* *******************
 * AUTO-GENERATED FILE
 * *******************
 * @NOTE This file is automatically generated from the contents of `@polyzone/core`
 * To regenerate this file, run `npm run build:core.g`
 *
 * DO NOT EDIT THIS FILE MANUALLY, AS ANY CHANGES TO IT WILL BE OVERWRITTEN.
 */

import * as Core from '@polyzone/core';
import * as WorldGameObject from '@polyzone/core/src/world/GameObject';
import * as WorldGameObjectComponent from '@polyzone/core/src/world/GameObjectComponent';
import * as WorldTransform from '@polyzone/core/src/world/Transform';
import * as World from '@polyzone/core/src/world';
import * as WorldComponentsCameraComponent from '@polyzone/core/src/world/components/CameraComponent';
import * as WorldComponentsDirectionalLightComponent from '@polyzone/core/src/world/components/DirectionalLightComponent';
import * as WorldComponentsMeshComponent from '@polyzone/core/src/world/components/MeshComponent';
import * as WorldComponentsPointLightComponent from '@polyzone/core/src/world/components/PointLightComponent';
import * as WorldComponentsScriptComponent from '@polyzone/core/src/world/components/ScriptComponent';
import * as WorldComponents from '@polyzone/core/src/world/components';
import * as UtilColor3 from '@polyzone/core/src/util/Color3';
import * as UtilColor4 from '@polyzone/core/src/util/Color4';
import * as UtilVector2 from '@polyzone/core/src/util/Vector2';
import * as UtilVector3 from '@polyzone/core/src/util/Vector3';
import * as Util from '@polyzone/core/src/util';
import * as ModulesIModule from '@polyzone/core/src/modules/IModule';
import * as ModulesInput from '@polyzone/core/src/modules/Input';
import * as Modules from '@polyzone/core/src/modules';
import * as ModulesWorldWorldModule from '@polyzone/core/src/modules/World/WorldModule';
import * as ModulesWorldWorldQuery from '@polyzone/core/src/modules/World/WorldQuery';
import * as ModulesWorld from '@polyzone/core/src/modules/World';

export interface CoreModuleDefinition {
  name: string;
  module: any;
}

// @NOTE These are all the imports that will be injected into scripts
// defined at runtime
export const CoreModules: CoreModuleDefinition[] = [
  {
    name: '@polyzone/core',
    module: Core,
  },
  {
    name: '@polyzone/core/world/GameObject',
    module: WorldGameObject,
  },
  {
    name: '@polyzone/core/world/GameObjectComponent',
    module: WorldGameObjectComponent,
  },
  {
    name: '@polyzone/core/world/Transform',
    module: WorldTransform,
  },
  {
    name: '@polyzone/core/world',
    module: World,
  },
  {
    name: '@polyzone/core/world/components/CameraComponent',
    module: WorldComponentsCameraComponent,
  },
  {
    name: '@polyzone/core/world/components/DirectionalLightComponent',
    module: WorldComponentsDirectionalLightComponent,
  },
  {
    name: '@polyzone/core/world/components/MeshComponent',
    module: WorldComponentsMeshComponent,
  },
  {
    name: '@polyzone/core/world/components/PointLightComponent',
    module: WorldComponentsPointLightComponent,
  },
  {
    name: '@polyzone/core/world/components/ScriptComponent',
    module: WorldComponentsScriptComponent,
  },
  {
    name: '@polyzone/core/world/components',
    module: WorldComponents,
  },
  {
    name: '@polyzone/core/util/Color3',
    module: UtilColor3,
  },
  {
    name: '@polyzone/core/util/Color4',
    module: UtilColor4,
  },
  {
    name: '@polyzone/core/util/Vector2',
    module: UtilVector2,
  },
  {
    name: '@polyzone/core/util/Vector3',
    module: UtilVector3,
  },
  {
    name: '@polyzone/core/util',
    module: Util,
  },
  {
    name: '@polyzone/core/modules/IModule',
    module: ModulesIModule,
  },
  {
    name: '@polyzone/core/modules/Input',
    module: ModulesInput,
  },
  {
    name: '@polyzone/core/modules',
    module: Modules,
  },
  {
    name: '@polyzone/core/modules/World/WorldModule',
    module: ModulesWorldWorldModule,
  },
  {
    name: '@polyzone/core/modules/World/WorldQuery',
    module: ModulesWorldWorldQuery,
  },
  {
    name: '@polyzone/core/modules/World',
    module: ModulesWorld,
  }
];
