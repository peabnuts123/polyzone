import { SceneNode } from "@lopoly/engine/scene";

export interface IGameObjectComponent {
  sceneNode: SceneNode;
  init(): void;
  onUpdate(dt: number, time: number): void;
  onDestroy(): void;
}
