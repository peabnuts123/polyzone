import type { FunctionComponent } from "react";

import type { GameObjectData, IEditorComponentData } from "@lib/project/data";
import type { ISceneViewController } from "@lib/composer/scene";

export interface InspectorComponentProps<TComponentType extends IEditorComponentData> {
  component: TComponentType;
  controller: ISceneViewController;
  gameObject: GameObjectData;
}

export type InspectorComponent<TComponentType extends IEditorComponentData> = FunctionComponent<InspectorComponentProps<TComponentType>>;
