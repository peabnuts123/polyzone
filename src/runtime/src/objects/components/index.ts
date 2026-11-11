import { GameObjectComponent as GameObjectComponentCore } from "@polyzone/core/objects/GameObjectComponent";
import { IGameObjectComponent } from "./IGameObjectComponent";

export * from './CameraComponent';
export * from './DirectionalLightComponent';
export * from './IGameObjectComponent';
export * from './MeshComponent';
export * from './PointLightComponent';
export * from './ScriptComponent';

/**
 * Runtime-specific GameObjectComponent type.
 */
export type GameObjectComponent = GameObjectComponentCore & IGameObjectComponent;
