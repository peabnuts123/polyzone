import { SceneNode } from "@lopoly/engine/scene";
import { EditorObject } from "../EditorObject";

export interface IEditorObjectComponent {
  get id(): string;
  get editorObject(): EditorObject;
  sceneNode: SceneNode;
  onDestroy(): void;
}
